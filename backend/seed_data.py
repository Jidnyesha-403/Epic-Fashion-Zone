import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_admin():
    """Create default admin user"""
    # Check for old admin email
    old_admin = await db.admins.find_one({"email": "admin@vanaweaves.com"})
    if old_admin:
        # Update to new email
        await db.admins.update_one(
            {"email": "admin@vanaweaves.com"},
            {"$set": {"email": "shital77ahirrao@gmail.com"}}
        )
        print("✓ Admin email updated to: shital77ahirrao@gmail.com")
    else:
        # Check if new admin exists
        existing = await db.admins.find_one({"email": "shital77ahirrao@gmail.com"})
        if not existing:
            admin = {
                "id": "admin-001",
                "email": "shital77ahirrao@gmail.com",
                "password_hash": pwd_context.hash("admin123"),
                "created_at": "2024-01-01T00:00:00"
            }
            await db.admins.insert_one(admin)
            print("✓ Admin user created: shital77ahirrao@gmail.com / admin123")
        else:
            print("✓ Admin user already exists")

async def seed_products():
    """Create sample products"""
    existing_count = await db.products.count_documents({})
    if existing_count > 0:
        print(f"✓ {existing_count} products already exist")
        return

    products = [
        {
            "id": "prod-001",
            "name": "Kanjeevaram Silk Saree - Royal Blue",
            "description": "Exquisite pure silk Kanjeevaram saree with traditional gold zari work. Perfect for weddings and festive occasions. Handwoven by master artisans from Tamil Nadu.",
            "images": [
                "https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1654764745582-69893ee8a985?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Sarees",
            "fabric": "Silk",
            "occasion": "Wedding",
            "price": 8500.0,
            "stock": 12,
            "tags": ["silk", "traditional", "handwoven", "wedding"],
            "featured": True,
            "new_arrival": True,
            "created_at": "2024-01-15T00:00:00"
        },
        {
            "id": "prod-002",
            "name": "Banarasi Georgette Saree - Maroon",
            "description": "Lightweight georgette saree with intricate Banarasi weaving. Comfortable and elegant for festive celebrations.",
            "images": [
                "https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1654764745582-69893ee8a985?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Sarees",
            "fabric": "Georgette",
            "occasion": "Festive",
            "price": 5500.0,
            "stock": 8,
            "tags": ["georgette", "banarasi", "festive"],
            "featured": True,
            "new_arrival": False,
            "created_at": "2024-01-10T00:00:00"
        },
        {
            "id": "prod-003",
            "name": "Pure Cotton Handloom Saree",
            "description": "Breathable pure cotton handloom saree in soft pastel colors. Perfect for daily wear and casual occasions.",
            "images": [
                "https://images.unsplash.com/photo-1654764745582-69893ee8a985?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Sarees",
            "fabric": "Cotton",
            "occasion": "Casual",
            "price": 2200.0,
            "stock": 20,
            "tags": ["cotton", "handloom", "casual", "comfortable"],
            "featured": False,
            "new_arrival": True,
            "created_at": "2024-01-20T00:00:00"
        },
        {
            "id": "prod-004",
            "name": "Tussar Silk Party Wear Saree",
            "description": "Rich tussar silk saree with modern design elements. Ideal for parties and evening events.",
            "images": [
                "https://images.unsplash.com/photo-1737514996816-a034a795febe?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1654764745582-69893ee8a985?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Sarees",
            "fabric": "Silk",
            "occasion": "Party",
            "price": 6800.0,
            "stock": 4,
            "tags": ["silk", "party", "modern"],
            "featured": True,
            "new_arrival": False,
            "created_at": "2024-01-05T00:00:00"
        },
        {
            "id": "prod-005",
            "name": "Handpainted Terracotta Lamp Set",
            "description": "Beautiful set of 3 handpainted terracotta lamps. Traditional designs crafted by local artisans. Adds warmth to any space.",
            "images": [
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Handicrafts",
            "fabric": None,
            "occasion": None,
            "price": 1800.0,
            "stock": 15,
            "tags": ["handpainted", "terracotta", "home decor", "traditional"],
            "featured": True,
            "new_arrival": True,
            "created_at": "2024-01-18T00:00:00"
        },
        {
            "id": "prod-006",
            "name": "Decorative Wall Hanging - Mandala",
            "description": "Intricate mandala design wall hanging made from brass and wood. Perfect for living room or meditation space.",
            "images": [
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Home Decor",
            "fabric": None,
            "occasion": None,
            "price": 3200.0,
            "stock": 6,
            "tags": ["wall art", "mandala", "brass", "wood"],
            "featured": False,
            "new_arrival": True,
            "created_at": "2024-01-22T00:00:00"
        },
        {
            "id": "prod-007",
            "name": "Handwoven Jute Basket Set",
            "description": "Eco-friendly set of 3 jute baskets in different sizes. Perfect for storage and gifting. Handwoven by rural artisans.",
            "images": [
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Handicrafts",
            "fabric": None,
            "occasion": None,
            "price": 1200.0,
            "stock": 25,
            "tags": ["jute", "eco-friendly", "storage", "handwoven"],
            "featured": False,
            "new_arrival": False,
            "created_at": "2024-01-08T00:00:00"
        },
        {
            "id": "prod-008",
            "name": "Traditional Brass Diya Set",
            "description": "Authentic brass diya set of 6 pieces. Perfect for festivals and special occasions. Handcrafted with traditional designs.",
            "images": [
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Gifts",
            "fabric": None,
            "occasion": "Festive",
            "price": 950.0,
            "stock": 18,
            "tags": ["brass", "diya", "festival", "traditional"],
            "featured": False,
            "new_arrival": False,
            "created_at": "2024-01-12T00:00:00"
        }
    ]

    await db.products.insert_many(products)
    print(f"✓ {len(products)} sample products created")

async def main():
    print("\n🌱 Seeding database...\n")
    await seed_admin()
    await seed_products()
    print("\n✅ Database seeding completed!\n")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
