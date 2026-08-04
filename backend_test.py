import requests
import sys
import json
from datetime import datetime

class VanaWeavesAPITester:
    def __init__(self, base_url="https://epic-fashion-store.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.admin_token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: Found {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        if 'access_token' in response_data:
                            print(f"   Response: Token received")
                        elif 'id' in response_data:
                            print(f"   Response: ID = {response_data['id']}")
                        else:
                            print(f"   Response: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data={"email": "admin@vanaweaves.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained successfully")
            return True
        return False

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        return success, response

    def test_get_products_with_filters(self):
        """Test product filtering"""
        # Test category filter
        success1, _ = self.run_test(
            "Get Products by Category (Sarees)",
            "GET",
            "products?category=Sarees",
            200
        )
        
        # Test fabric filter
        success2, _ = self.run_test(
            "Get Products by Fabric (Silk)",
            "GET",
            "products?fabric=Silk",
            200
        )
        
        # Test featured products
        success3, _ = self.run_test(
            "Get Featured Products",
            "GET",
            "products?featured=true",
            200
        )
        
        # Test search
        success4, _ = self.run_test(
            "Search Products (silk)",
            "GET",
            "products?search=silk",
            200
        )
        
        return success1 and success2 and success3 and success4

    def test_create_product(self):
        """Test creating a new product"""
        if not self.admin_token:
            print("❌ Cannot test product creation - no admin token")
            return False
            
        product_data = {
            "name": "Test Silk Saree",
            "description": "Beautiful test silk saree for automated testing",
            "images": ["https://example.com/test-image.jpg"],
            "category": "Sarees",
            "fabric": "Silk",
            "occasion": "Wedding",
            "price": 5000.0,
            "stock": 10,
            "tags": ["test", "silk", "wedding"],
            "featured": True,
            "new_arrival": True
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data
        )
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   Created product ID: {self.created_product_id}")
        
        return success

    def test_get_single_product(self):
        """Test getting a single product"""
        if not self.created_product_id:
            print("❌ Cannot test single product - no product ID")
            return False
            
        success, _ = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.created_product_id}",
            200
        )
        return success

    def test_update_product(self):
        """Test updating a product"""
        if not self.admin_token or not self.created_product_id:
            print("❌ Cannot test product update - missing token or product ID")
            return False
            
        update_data = {
            "name": "Updated Test Silk Saree",
            "description": "Updated description for test silk saree",
            "images": ["https://example.com/updated-image.jpg"],
            "category": "Sarees",
            "fabric": "Silk",
            "occasion": "Wedding",
            "price": 5500.0,
            "stock": 8,
            "tags": ["test", "silk", "wedding", "updated"],
            "featured": True,
            "new_arrival": False
        }
        
        success, _ = self.run_test(
            "Update Product",
            "PUT",
            f"products/{self.created_product_id}",
            200,
            data=update_data
        )
        return success

    def test_create_order(self):
        """Test creating an order"""
        if not self.created_product_id:
            print("❌ Cannot test order creation - no product ID")
            return False
            
        order_data = {
            "customer_name": "Test Customer",
            "email": "test@example.com",
            "phone": "9876543210",
            "address": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "items": [
                {
                    "product_id": self.created_product_id,
                    "product_name": "Test Silk Saree",
                    "price": 5000.0,
                    "quantity": 2,
                    "image": "https://example.com/test-image.jpg"
                }
            ],
            "total": 10000.0,
            "payment_method": "COD"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Created order ID: {self.created_order_id}")
            print(f"   Order number: {response.get('order_number', 'N/A')}")
        
        return success

    def test_get_orders(self):
        """Test getting all orders (admin only)"""
        if not self.admin_token:
            print("❌ Cannot test get orders - no admin token")
            return False
            
        success, response = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        return success

    def test_update_order_status(self):
        """Test updating order status"""
        if not self.admin_token or not self.created_order_id:
            print("❌ Cannot test order status update - missing token or order ID")
            return False
            
        success, _ = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{self.created_order_id}/status",
            200,
            data={"status": "Packed"}
        )
        return success

    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.admin_token:
            print("❌ Cannot test analytics - no admin token")
            return False
            
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   Total Sales: ₹{response.get('total_sales', 0)}")
            print(f"   Total Orders: {response.get('total_orders', 0)}")
            print(f"   Pending Orders: {response.get('pending_orders', 0)}")
            print(f"   Low Stock Count: {response.get('low_stock_count', 0)}")
        
        return success

    def test_delete_product(self):
        """Test deleting a product (cleanup)"""
        if not self.admin_token or not self.created_product_id:
            print("❌ Cannot test product deletion - missing token or product ID")
            return False
            
        success, _ = self.run_test(
            "Delete Product (Cleanup)",
            "DELETE",
            f"products/{self.created_product_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Vana Weaves API Testing...")
    print("=" * 60)
    
    tester = VanaWeavesAPITester()
    
    # Test sequence
    tests = [
        ("Admin Authentication", tester.test_admin_login),
        ("Product Listing", tester.test_get_products),
        ("Product Filtering", tester.test_get_products_with_filters),
        ("Product Creation", tester.test_create_product),
        ("Single Product Retrieval", tester.test_get_single_product),
        ("Product Update", tester.test_update_product),
        ("Order Creation", tester.test_create_order),
        ("Orders Listing", tester.test_get_orders),
        ("Order Status Update", tester.test_update_order_status),
        ("Analytics", tester.test_analytics),
        ("Product Deletion", tester.test_delete_product),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
            tester.tests_run += 1
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())