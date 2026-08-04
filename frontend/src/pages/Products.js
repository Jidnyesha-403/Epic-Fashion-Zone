import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    fabric: '',
    occasion: '',
    priceRange: [0, 50000],
    search: ''
  });

  useEffect(() => {
    fetchProducts();
    updateCounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const updateCounts = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    setWishlistCount(wishlist.length);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.fabric) {
      filtered = filtered.filter(p => p.fabric === filters.fabric);
    }

    if (filters.occasion) {
      filtered = filtered.filter(p => p.occasion === filters.occasion);
    }

    filtered = filtered.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      fabric: '',
      occasion: '',
      priceRange: [0, 50000],
      search: ''
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-4" data-testid="products-title">
            Our Collection
          </h1>
          <p className="text-stone-600 text-lg">Explore our curated selection of handloom treasures</p>
        </div>

        {/* Search and Filter Toggle */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 h-12 bg-white border-stone-200 text-base"
              data-testid="search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center bg-white border border-stone-200 hover:bg-stone-50 rounded-lg px-6 py-3 font-medium transition-colors min-h-[48px]"
            data-testid="toggle-filters-button"
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="lg:w-64 space-y-6" data-testid="filters-sidebar">
              <div className="bg-white rounded-xl p-6 border border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-900">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700"
                    data-testid="clear-filters-button"
                  >
                    Clear All
                  </button>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Category</label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger className="h-11" data-testid="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Categories</SelectItem>
                      <SelectItem value="Sarees">Sarees</SelectItem>
                      <SelectItem value="Handicrafts">Handicrafts</SelectItem>
                      <SelectItem value="Home Decor">Home Decor</SelectItem>
                      <SelectItem value="Gifts">Gifts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fabric */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Fabric</label>
                  <Select value={filters.fabric} onValueChange={(value) => handleFilterChange('fabric', value)}>
                    <SelectTrigger className="h-11" data-testid="fabric-filter">
                      <SelectValue placeholder="All Fabrics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Fabrics</SelectItem>
                      <SelectItem value="Silk">Silk</SelectItem>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Georgette">Georgette</SelectItem>
                      <SelectItem value="Handloom">Handloom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Occasion */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Occasion</label>
                  <Select value={filters.occasion} onValueChange={(value) => handleFilterChange('occasion', value)}>
                    <SelectTrigger className="h-11" data-testid="occasion-filter">
                      <SelectValue placeholder="All Occasions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Occasions</SelectItem>
                      <SelectItem value="Festive">Festive</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-2 block">
                    Price Range: ₹{filters.priceRange[0].toLocaleString('en-IN')} - ₹{filters.priceRange[1].toLocaleString('en-IN')}
                  </label>
                  <Slider
                    min={0}
                    max={50000}
                    step={500}
                    value={filters.priceRange}
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                    className="mt-2"
                    data-testid="price-slider"
                  />
                </div>
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-stone-600" data-testid="products-count">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12" data-testid="loading-state">
                <p className="text-stone-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-stone-100" data-testid="no-products">
                <p className="text-stone-500 mb-4">No products found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" data-testid="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToWishlist={updateCounts} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
