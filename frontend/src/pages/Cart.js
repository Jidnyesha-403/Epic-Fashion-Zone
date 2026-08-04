import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    loadCart();
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlistCount(wishlist.length);
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: Math.min(newQuantity, item.stock) } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-8" data-testid="cart-title">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-100" data-testid="empty-cart">
            <p className="text-stone-500 text-lg mb-6">Your cart is empty</p>
            <Link to="/products">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8" data-testid="continue-shopping-button">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-stone-100 flex gap-6" data-testid={`cart-item-${item.id}`}>
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-32 h-32 object-cover rounded-lg"
                    data-testid={`cart-item-image-${item.id}`}
                  />
                  <div className="flex-1">
                    <Link to={`/products/${item.id}`}>
                      <h3 className="font-semibold text-lg text-stone-900 mb-1 hover:text-orange-600" data-testid={`cart-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-stone-500 text-sm mb-3">{item.category}</p>
                    <p className="font-outfit font-semibold text-xl text-stone-900 mb-4" data-testid={`cart-item-price-${item.id}`}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-stone-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-stone-50"
                          data-testid={`decrease-quantity-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-1 border-x border-stone-200 min-w-[3rem] text-center" data-testid={`cart-item-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-stone-50"
                          data-testid={`increase-quantity-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-600 hover:text-rose-700 p-2"
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-stone-100 sticky top-24" data-testid="order-summary">
                <h2 className="font-playfair text-2xl font-semibold text-stone-900 mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span data-testid="subtotal">₹{getTotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span data-testid="total">₹{getTotal().toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-medium rounded-full mb-4"
                  data-testid="proceed-checkout-button"
                >
                  Proceed to Checkout
                </Button>

                <Link to="/products">
                  <Button variant="outline" className="w-full h-11 rounded-full border-stone-200" data-testid="continue-shopping-link">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
