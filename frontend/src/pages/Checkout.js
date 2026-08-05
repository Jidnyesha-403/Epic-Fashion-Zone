import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'ONLINE'
  });

  useEffect(() => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cartData.length === 0) {
      navigate('/cart');
      return;
    }
    setCart(cartData);

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlistCount(wishlist.length);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order first
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images[0]
        })),
        total: getTotal(),
        payment_method: formData.payment_method
      };

      if (formData.payment_method === 'ONLINE') {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway. Please try again.');
          setLoading(false);
          return;
        }

        // Create order in backend
        const response = await axios.post(`${API}/orders`, orderData);
        const order = response.data;

        // Create Razorpay order
        const paymentOrderResponse = await axios.post(`${API}/payment/create-order`, {
          amount: getTotal(),
          currency: 'INR',
          order_id: order.id
        });

        const { razorpay_order_id, amount, currency, key_id } = paymentOrderResponse.data;

        // Razorpay options
        const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          order_id: razorpay_order_id,
          name: 'Epic Fashion Zone',
          description: `Order #${order.order_number}`,
          image: 'https://customer-assets.emergentagent.com/job_ethnic-treasures-12/artifacts/0qjx6l1g_Screenshot_20250308_115550_WhatsApp.jpg',
          handler: async function (response) {
            try {
              // Verify payment
              await axios.post(`${API}/payment/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              // Clear cart
              localStorage.setItem('cart', JSON.stringify([]));
              
              toast.success('Payment successful!', {
                description: `Order number: ${order.order_number}`
              });
              
              setTimeout(() => {
                navigate('/');
              }, 2000);
            } catch (error) {
              console.error('Payment verification failed:', error);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: formData.customer_name,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#ea580c'
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
              toast.info('Payment cancelled');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // COD payment
        const response = await axios.post(`${API}/orders`, orderData);
        
        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        
        toast.success('Order placed successfully!', {
          description: `Order number: ${response.data.order_number}`
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-8" data-testid="checkout-title">
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-stone-100" data-testid="checkout-form">
              <h2 className="font-playfair text-2xl font-semibold text-stone-900 mb-6">Delivery Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                    className="mt-1 h-11"
                    data-testid="input-name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 h-11"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="mt-1 h-11"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="mt-1 h-11"
                    data-testid="input-address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="mt-1 h-11"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="mt-1 h-11"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="mt-1 h-11"
                      data-testid="input-pincode"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-stone-200">
                <h3 className="font-semibold text-lg text-stone-900 mb-4">Payment Method</h3>
                <RadioGroup value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <div className="flex items-center space-x-2 p-4 border border-stone-200 rounded-lg mb-3" data-testid="payment-online">
                    <RadioGroupItem value="ONLINE" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <span className="font-medium">Online Payment (Razorpay)</span>
                      <p className="text-sm text-stone-500">Pay securely via UPI, Cards, Net Banking, Wallets</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-stone-200 rounded-lg" data-testid="payment-cod">
                    <RadioGroupItem value="COD" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <span className="font-medium">Cash on Delivery (COD)</span>
                      <p className="text-sm text-stone-500">Pay when you receive the product</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-stone-100 sticky top-24" data-testid="order-summary">
                <h2 className="font-playfair text-2xl font-semibold text-stone-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3" data-testid={`summary-item-${item.id}`}>
                      <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-stone-900 line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-stone-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 border-t border-stone-200 pt-4">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span data-testid="summary-subtotal">₹{getTotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span data-testid="summary-total">₹{getTotal().toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-medium rounded-full"
                  data-testid="place-order-button"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
