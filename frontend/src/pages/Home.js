import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    fetchProducts();
    updateCounts();
  }, []);

  const updateCounts = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    setWishlistCount(wishlist.length);
  };

  const fetchProducts = async () => {
    try {
      const [featuredRes, newRes] = await Promise.all([
        axios.get(`${API}/products?featured=true`),
        axios.get(`${API}/products?new_arrival=true`)
      ]);
      setFeaturedProducts(featuredRes.data.slice(0, 4));
      setNewArrivals(newRes.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1742287724816-4a8a1cc7ad5c?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt="Elegant handloom sarees"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12 sm:pb-16 md:pb-24">
          <div className="max-w-2xl">
            <h1 className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-3 sm:mb-4" data-testid="hero-title">
              Timeless Elegance,<br />
              <span className="italic">Woven with Heritage</span>
            </h1>
            <p className="text-stone-200 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 md:mb-8 leading-relaxed">
              Discover authentic handloom sarees and traditional handicrafts crafted by Indian artisans.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-orange-600 text-white hover:bg-orange-700 rounded-full px-6 sm:px-8 py-2.5 sm:py-3 font-medium transition-all shadow-lg hover:shadow-orange-600/20 text-sm sm:text-base"
              data-testid="shop-now-button"
            >
              Shop Now
              <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Link to="/products?category=Sarees" className="group relative h-64 sm:h-72 md:h-80 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all" data-testid="category-sarees">
            <img
              src="https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Sarees"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Sarees</h3>
              <p className="text-stone-200 text-xs sm:text-sm">Handwoven masterpieces</p>
            </div>
          </Link>

          <Link to="/products?category=Handicrafts" className="group relative h-64 sm:h-72 md:h-80 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all" data-testid="category-handicrafts">
            <img
              src="https://images.unsplash.com/photo-1762173886363-de541417e48e?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Handicrafts"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Handicrafts</h3>
              <p className="text-stone-200 text-xs sm:text-sm">Artistic home decor</p>
            </div>
          </Link>

          <Link to="/products?category=Gifts" className="group relative h-64 sm:h-72 md:h-80 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all sm:col-span-2 md:col-span-1" data-testid="category-gifts">
            <img
              src="https://images.unsplash.com/photo-1759607236409-1df137ecb3b6?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Gifts"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Gift Items</h3>
              <p className="text-stone-200 text-xs sm:text-sm">Perfect for every occasion</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white" data-testid="featured-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-stone-900 mb-2">Featured Collection</h2>
                <p className="text-stone-500">Handpicked favorites from our artisans</p>
              </div>
              <Link to="/products" className="text-orange-600 hover:text-orange-700 font-medium flex items-center" data-testid="view-all-featured">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToWishlist={updateCounts} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16" data-testid="new-arrivals-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-stone-900 mb-2">New Arrivals</h2>
                <p className="text-stone-500">Fresh from the looms</p>
              </div>
              <Link to="/products?new_arrival=true" className="text-orange-600 hover:text-orange-700 font-medium flex items-center" data-testid="view-all-new">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} onAddToWishlist={updateCounts} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-orange-100/50 to-indigo-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1664101606938-e664f5852fac?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Artisan at work"
                className="rounded-xl shadow-lg"
              />
            </div>
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-semibold text-stone-900 mb-6">
                Preserving Traditional Craftsmanship
              </h2>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                For over three decades, we've been committed to supporting local artisans and bringing authentic handloom products to your doorstep. Each piece tells a story of heritage, skill, and dedication.
              </p>
              <p className="text-stone-600 text-lg leading-relaxed mb-8">
                When you shop with us, you're not just buying a product – you're preserving an art form and supporting livelihoods.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center bg-white text-stone-900 border border-stone-200 hover:bg-stone-50 rounded-full px-6 py-2 font-medium transition-colors"
                data-testid="explore-collection-button"
              >
                Explore Our Collection
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
