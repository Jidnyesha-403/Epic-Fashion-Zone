import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    updateCounts();
  }, [id]);

  const updateCounts = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    setWishlistCount(wishlist.length);
    setIsInWishlist(wishlist.some(item => item.id === id));
  };

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product || product.stock === 0) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCounts();
    toast.success('Added to cart!', { description: `${product.name} x ${quantity}` });
  };

  const toggleWishlist = () => {
    if (!product) return;

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

    if (isInWishlist) {
      const updated = wishlist.filter(item => item.id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsInWishlist(false);
      toast.info('Removed from wishlist');
    } else {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsInWishlist(true);
      toast.success('Added to wishlist!');
    }
    updateCounts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-stone-500" data-testid="loading-state">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-stone-500" data-testid="product-not-found">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 text-sm text-stone-500">
          <Link to="/" className="hover:text-orange-600" data-testid="breadcrumb-home">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-600" data-testid="breadcrumb-products">Products</Link>
          <span>/</span>
          <span className="text-stone-900" data-testid="breadcrumb-current">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="bg-white rounded-xl overflow-hidden mb-4 aspect-square">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="main-product-image"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-orange-600' : 'border-transparent'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-playfair text-4xl font-bold text-stone-900 mb-4" data-testid="product-title">
              {product.name}
            </h1>

            <div className="flex items-center space-x-4 mb-6">
              <span className="font-outfit text-3xl font-semibold text-stone-900" data-testid="product-price">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.stock > 0 ? (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium" data-testid="stock-badge">
                  <Check className="inline h-4 w-4 mr-1" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm font-medium" data-testid="out-of-stock-badge">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="border-t border-b border-stone-200 py-6 mb-6">
              <p className="text-stone-600 text-lg leading-relaxed" data-testid="product-description">{product.description}</p>
            </div>

            {/* Product Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Category</span>
                <span className="text-stone-900" data-testid="product-category">{product.category}</span>
              </div>
              {product.fabric && (
                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Fabric</span>
                  <span className="text-stone-900" data-testid="product-fabric">{product.fabric}</span>
                </div>
              )}
              {product.occasion && (
                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Occasion</span>
                  <span className="text-stone-900" data-testid="product-occasion">{product.occasion}</span>
                </div>
              )}
              {product.tags.length > 0 && (
                <div className="flex items-start justify-between py-3">
                  <span className="text-stone-500 font-medium">Tags</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm" data-testid={`tag-${index}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {product.stock > 0 && (
              <div className="flex items-center space-x-3 mb-4">
                <label className="text-stone-700 font-medium">Quantity:</label>
                <div className="flex items-center border border-stone-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-stone-50"
                    data-testid="decrease-quantity"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-stone-200" data-testid="quantity-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-stone-50"
                    data-testid="increase-quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={addToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-medium rounded-full"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                onClick={toggleWishlist}
                variant="outline"
                className="h-12 px-6 rounded-full border-stone-200"
                data-testid="wishlist-toggle-button"
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-orange-600 text-orange-600' : 'text-stone-600'}`} />
              </Button>
            </div>

            {product.stock < 5 && product.stock > 0 && (
              <p className="mt-4 text-amber-700 text-sm" data-testid="low-stock-warning">
                Hurry! Only {product.stock} left in stock.
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
