import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadWishlist();
    updateCartCount();
  }, []);

  const loadWishlist = () => {
    const wishlistData = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(wishlistData);
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item.id !== productId);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    toast.success('Removed from wishlist');
  };

  const moveToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    removeFromWishlist(product.id);
    updateCartCount();
    toast.success('Moved to cart!');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlist.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-8" data-testid="wishlist-title">
          My Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-100" data-testid="empty-wishlist">
            <p className="text-stone-500 text-lg mb-6">Your wishlist is empty</p>
            <Link to="/products">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8" data-testid="browse-products-button">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" data-testid="wishlist-grid">
            {wishlist.map((product) => (
              <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm" data-testid={`wishlist-item-${product.id}`}>
                <Link to={`/products/${product.id}`}>
                  <div className="relative aspect-[3/4] bg-stone-100">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                        <span className="bg-white text-stone-900 px-4 py-2 rounded-full font-medium" data-testid={`out-of-stock-${product.id}`}>
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-medium text-stone-900 mb-1 line-clamp-1 hover:text-orange-600" data-testid={`wishlist-name-${product.id}`}>
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-stone-500 mb-3">{product.category}</p>
                  <p className="font-outfit font-semibold text-lg text-stone-900 mb-4" data-testid={`wishlist-price-${product.id}`}>
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => moveToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-10 rounded-full"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      onClick={() => removeFromWishlist(product.id)}
                      variant="outline"
                      className="h-10 px-3 rounded-full border-stone-200"
                      data-testid={`remove-wishlist-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;
