from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import cloudinary
import cloudinary.utils
import time
import razorpay

ROOT_DIR = Path(__file__).parent
# Use /tmp for uploads in serverless environments (Vercel has read-only filesystem)
UPLOAD_DIR = Path("/tmp/uploads") if os.environ.get("VERCEL") else ROOT_DIR / "uploads"
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass
load_dotenv(ROOT_DIR / '.env')

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Default test Razorpay credentials
DEFAULT_RAZORPAY_KEY_ID = "rzp_test_default"
DEFAULT_RAZORPAY_KEY_SECRET = "test_secret_default"

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'epic_fashion_zone')]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class AdminCreate(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str = "customer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    password_hash: str
    role: str = "customer"
    profile_image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    address_line: str
    city: str
    state: str
    pincode: str
    is_default: bool = False

class UserProfile(BaseModel):
    user_id: str
    addresses: List[Address] = []

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str

class ProductCreate(BaseModel):
    name: str
    description: str
    images: List[str]
    category: str
    fabric: Optional[str] = None
    occasion: Optional[str] = None
    price: float
    stock: int
    tags: List[str] = []
    featured: bool = False
    new_arrival: bool = False

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    images: List[str]
    category: str
    fabric: Optional[str] = None
    occasion: Optional[str] = None
    price: float
    stock: int
    tags: List[str] = []
    featured: bool = False
    new_arrival: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockUpdate(BaseModel):
    stock: int

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int
    image: str

class OrderCreate(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    items: List[OrderItem]
    total: float
    payment_method: str
    user_id: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    items: List[OrderItem]
    total: float
    payment_method: str
    status: str = "Pending"
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderStatusUpdate(BaseModel):
    status: str

class Analytics(BaseModel):
    total_sales: float
    total_orders: int
    pending_orders: int
    low_stock_count: int
    best_selling_products: List[dict]

class PaymentSettings(BaseModel):
    razorpay_key_id: str
    razorpay_key_secret: str
    razorpay_mode: str = "test"  # test or live

class PaymentSettingsUpdate(BaseModel):
    razorpay_key_id: str
    razorpay_key_secret: str
    razorpay_mode: str = "test"

class PaymentOrder(BaseModel):
    amount: float
    currency: str = "INR"
    order_id: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auth endpoints
@api_router.post("/auth/admin/register", response_model=Admin)
async def register_admin(admin_data: AdminCreate):
    existing = await db.admins.find_one({"email": admin_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = Admin(
        email=admin_data.email,
        password_hash=hash_password(admin_data.password)
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    return admin

@api_router.post("/auth/admin/login", response_model=Token)
async def login_admin(login_data: AdminLogin):
    admin = await db.admins.find_one({"email": login_data.email}, {"_id": 0})
    if not admin or not verify_password(login_data.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin['email']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Unified Auth Endpoints
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check phone
    existing_phone = await db.users.find_one({"phone": user_data.phone}, {"_id": 0})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Check admin first
    admin = await db.admins.find_one({"email": login_data.email}, {"_id": 0})
    if admin and verify_password(login_data.password, admin['password_hash']):
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": admin['email'], "role": "admin"}, 
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": admin.get('id', admin['email']),
                "email": admin['email'],
                "role": "admin"
            }
        }
    
    # Check customer
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['id'], "role": user['role']}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "phone": user['phone'],
            "role": user['role']
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    return {
        "id": user['id'],
        "name": user.get('name'),
        "email": user['email'],
        "phone": user.get('phone'),
        "role": user.get('role', 'customer')
    }

# User Profile & Address Management
@api_router.get("/user/addresses")
async def get_user_addresses(user: dict = Depends(get_current_user)):
    profile = await db.user_profiles.find_one({"user_id": user['id']}, {"_id": 0})
    if not profile:
        return {"addresses": []}
    return {"addresses": profile.get('addresses', [])}

@api_router.post("/user/addresses")
async def add_user_address(address: Address, user: dict = Depends(get_current_user)):
    profile = await db.user_profiles.find_one({"user_id": user['id']}, {"_id": 0})
    
    if not profile:
        profile = {"user_id": user['id'], "addresses": []}
    
    # If this is default, unset others
    if address.is_default:
        for addr in profile.get('addresses', []):
            addr['is_default'] = False
    
    profile.setdefault('addresses', []).append(address.model_dump())
    
    await db.user_profiles.update_one(
        {"user_id": user['id']},
        {"$set": profile},
        upsert=True
    )
    
    return {"message": "Address added successfully", "address": address}

@api_router.delete("/user/addresses/{address_id}")
async def delete_user_address(address_id: str, user: dict = Depends(get_current_user)):
    profile = await db.user_profiles.find_one({"user_id": user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    addresses = [addr for addr in profile.get('addresses', []) if addr['id'] != address_id]
    
    await db.user_profiles.update_one(
        {"user_id": user['id']},
        {"$set": {"addresses": addresses}}
    )
    
    return {"message": "Address deleted successfully"}

# Customer Order History
@api_router.get("/user/orders")
async def get_user_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

# One-time setup endpoint (REMOVE AFTER USE)
@api_router.post("/setup/create-admin")
async def setup_admin():
    """One-time endpoint to create admin user - DELETE AFTER FIRST USE"""
    existing = await db.admins.find_one({"email": "shital77ahirrao@gmail.com"}, {"_id": 0})
    if existing:
        return {"message": "Admin already exists", "status": "exists"}
    
    admin = {
        "id": "admin-001",
        "email": "shital77ahirrao@gmail.com",
        "password_hash": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin)
    return {"message": "Admin created successfully", "email": "shital77ahirrao@gmail.com", "status": "created"}

# Cloudinary signature endpoint
@api_router.get("/cloudinary/signature")
async def generate_cloudinary_signature(
    folder: str = "products",
    admin: dict = Depends(get_current_admin)
):
    """Generate signature for Cloudinary upload"""
    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": "image"
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": folder
    }

# Local Image Upload Endpoint
@api_router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    """Upload image locally to backend/uploads/ directory"""
    try:
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = UPLOAD_DIR / unique_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"/uploads/{unique_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    fabric: Optional[str] = None,
    occasion: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    limit: int = 100,
    skip: int = 0
):
    query = {}
    if category:
        query['category'] = category
    if fabric:
        query['fabric'] = fabric
    if occasion:
        query['occasion'] = occasion
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'tags': {'$regex': search, '$options': 'i'}}
        ]
    if featured is not None:
        query['featured'] = featured
    if new_arrival is not None:
        query['new_arrival'] = new_arrival
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(min(limit, 100)).to_list(100)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: dict = Depends(get_current_admin)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin: dict = Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.patch("/products/{product_id}/stock")
async def update_product_stock(
    product_id: str,
    stock_data: StockUpdate,
    admin: dict = Depends(get_current_admin)
):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_stock = max(0, stock_data.stock)
    await db.products.update_one({"id": product_id}, {"$set": {"stock": new_stock}})
    return {"message": "Stock updated successfully", "stock": new_stock}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Generate order number
    order_count = await db.orders.count_documents({})
    order_number = f"ORD{str(order_count + 1).zfill(6)}"
    
    order = Order(
        order_number=order_number,
        **order_data.model_dump()
    )
    
    # Reduce stock for each item
    for item in order.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            new_stock = product['stock'] - item.quantity
            await db.products.update_one(
                {"id": item.product_id},
                {"$set": {"stock": max(0, new_stock)}}
            )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(admin: dict = Depends(get_current_admin), limit: int = 100, skip: int = 0):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(min(limit, 100)).to_list(100)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, admin: dict = Depends(get_current_admin)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}

# Analytics endpoint
@api_router.get("/analytics", response_model=Analytics)
async def get_analytics(admin: dict = Depends(get_current_admin)):
    # Total sales and orders (limit to recent 1000 orders for performance)
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(1000).to_list(1000)
    total_sales = sum(order['total'] for order in orders)
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "Pending"})
    
    # Low stock products (stock < 5)
    low_stock = await db.products.count_documents({"stock": {"$lt": 5}})
    
    # Best selling products (from recent orders)
    product_sales = {}
    for order in orders:
        for item in order['items']:
            if item['product_id'] not in product_sales:
                product_sales[item['product_id']] = {
                    'product_name': item['product_name'],
                    'quantity': 0,
                    'revenue': 0
                }
            product_sales[item['product_id']]['quantity'] += item['quantity']
            product_sales[item['product_id']]['revenue'] += item['price'] * item['quantity']
    
    best_selling = sorted(
        [{'product_name': v['product_name'], 'quantity': v['quantity'], 'revenue': v['revenue']} 
         for v in product_sales.values()],
        key=lambda x: x['quantity'],
        reverse=True
    )[:5]
    
    return Analytics(
        total_sales=total_sales,
        total_orders=total_orders,
        pending_orders=pending_orders,
        low_stock_count=low_stock,
        best_selling_products=best_selling
    )

# Payment Settings endpoints
@api_router.get("/settings/payment")
async def get_payment_settings(admin: dict = Depends(get_current_admin)):
    """Get payment settings (key_id only, not secret)"""
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
    if not settings:
        return {
            "razorpay_key_id": DEFAULT_RAZORPAY_KEY_ID,
            "razorpay_mode": "test"
        }
    return {
        "razorpay_key_id": settings.get("razorpay_key_id", DEFAULT_RAZORPAY_KEY_ID),
        "razorpay_mode": settings.get("razorpay_mode", "test")
    }

@api_router.put("/settings/payment")
async def update_payment_settings(settings: PaymentSettingsUpdate, admin: dict = Depends(get_current_admin)):
    """Update payment settings"""
    await db.settings.update_one(
        {"type": "payment"},
        {
            "$set": {
                "razorpay_key_id": settings.razorpay_key_id,
                "razorpay_key_secret": settings.razorpay_key_secret,
                "razorpay_mode": settings.razorpay_mode,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    return {"message": "Payment settings updated successfully"}

async def get_razorpay_client():
    """Get Razorpay client with credentials from database"""
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
    if settings:
        key_id = settings.get("razorpay_key_id", DEFAULT_RAZORPAY_KEY_ID)
        key_secret = settings.get("razorpay_key_secret", DEFAULT_RAZORPAY_KEY_SECRET)
    else:
        key_id = DEFAULT_RAZORPAY_KEY_ID
        key_secret = DEFAULT_RAZORPAY_KEY_SECRET
    
    return razorpay.Client(auth=(key_id, key_secret))

@api_router.post("/payment/create-order")
async def create_payment_order(order_data: PaymentOrder):
    """Create Razorpay order"""
    try:
        client = await get_razorpay_client()
        
        # Get settings to return key_id to frontend
        settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
        key_id = settings.get("razorpay_key_id", DEFAULT_RAZORPAY_KEY_ID) if settings else DEFAULT_RAZORPAY_KEY_ID
        
        # Create order
        razorpay_order = client.order.create({
            "amount": int(order_data.amount * 100),  # Convert to paise
            "currency": order_data.currency,
            "receipt": order_data.order_id,
            "payment_capture": 1
        })
        
        # Store in database
        await db.payment_orders.insert_one({
            "razorpay_order_id": razorpay_order["id"],
            "order_id": order_data.order_id,
            "amount": order_data.amount,
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "razorpay_order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": key_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
):
    """Verify Razorpay payment"""
    try:
        client = await get_razorpay_client()
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        
        # Update payment status
        await db.payment_orders.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {
                "$set": {
                    "razorpay_payment_id": razorpay_payment_id,
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {"status": "success", "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
