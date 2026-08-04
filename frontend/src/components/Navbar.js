import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Search, Menu, User, LogOut, X, Sparkles, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = ({ cartCount = 0, wishlistCount = 0 }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-amber-600 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-playfair text-2xl font-black tracking-tight text-indigo-950 group-hover:text-amber-700 transition-colors">
                EPIC FASHION
              </span>
              <span className="text-[10px] tracking-[0.25em] font-semibold text-amber-600 uppercase -mt-1">
                ZONE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-products"
            >
              Shop All
            </Link>
            
            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2 outline-none">
                Categories
                <ChevronDown className="h-3 w-3 text-stone-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/products?category=Sarees" className="w-full cursor-pointer">Sarees</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=Handicrafts" className="w-full cursor-pointer">Handicrafts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=Home Decor" className="w-full cursor-pointer">Home Decor</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products?category=Gifts" className="w-full cursor-pointer">Gifts</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/products?category=Sarees"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-sarees"
            >
              Sarees
            </Link>
            <Link
              to="/products?category=Handicrafts"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-handicrafts"
            >
              Handicrafts
            </Link>
            <Link
              to="/products?category=Home Decor"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-homedecor"
            >
              Home Decor
            </Link>
            <Link
              to="/products?category=Gifts"
              className="text-xs uppercase tracking-widest font-semibold text-stone-700 hover:text-indigo-950 transition-colors py-2"
              data-testid="nav-gifts"
            >
              Gifts
            </Link>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700"
              title="Search products"
              data-testid="search-button"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700"
              title="Wishlist"
              data-testid="wishlist-link"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs"
                  data-testid="wishlist-count"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-700"
              title="Cart"
              data-testid="cart-link"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-indigo-950 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs"
                  data-testid="cart-count"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Admin Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 p-1.5 pl-3 border border-stone-200 rounded-full hover:bg-stone-50 transition-colors"
                    data-testid="user-menu-button"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-950 text-amber-300 flex items-center justify-center text-xs font-bold">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-xs font-medium text-stone-800 pr-1 max-w-[120px] truncate">
                      {user.name || user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg border-stone-200">
                  <DropdownMenuLabel className="font-semibold text-stone-900">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="font-medium text-indigo-900 cursor-pointer" data-testid="admin-dashboard-link">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="cursor-pointer" data-testid="my-orders-link">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/addresses" className="cursor-pointer" data-testid="my-addresses-link">
                      Saved Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 font-medium cursor-pointer" data-testid="logout-button">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                className="bg-indigo-950 hover:bg-indigo-900 text-amber-300 font-medium text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-colors shadow-xs"
                data-testid="login-button"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Search Modal / Popover Bar */}
        {isSearchOpen && (
          <div className="py-3 px-2 border-t border-stone-200 bg-stone-50/80 animate-in fade-in slide-in-from-top-2 duration-200" data-testid="search-bar">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search for sarees, handicrafts, home decor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-900"
                  autoFocus
                  data-testid="search-input"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-semibold px-5 py-2 rounded-full transition-colors"
                data-testid="search-submit"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 bg-white" data-testid="mobile-menu">
            <div className="flex flex-col space-y-3 px-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider text-stone-700 hover:text-indigo-950 py-1"
                data-testid="mobile-nav-home"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider text-stone-700 hover:text-indigo-950 py-1"
                data-testid="mobile-nav-products"
              >
                Shop All Products
              </Link>
              <div className="pt-2 pb-1 border-t border-stone-100">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">Categories</span>
              </div>
              <Link
                to="/products?category=Sarees"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-stone-600 hover:text-indigo-950 pl-2"
                data-testid="mobile-nav-sarees"
              >
                Sarees
              </Link>
              <Link
                to="/products?category=Handicrafts"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-stone-600 hover:text-indigo-950 pl-2"
                data-testid="mobile-nav-handicrafts"
              >
                Handicrafts
              </Link>
              <Link
                to="/products?category=Home Decor"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-stone-600 hover:text-indigo-950 pl-2"
                data-testid="mobile-nav-homedecor"
              >
                Home Decor
              </Link>
              <Link
                to="/products?category=Gifts"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-stone-600 hover:text-indigo-950 pl-2"
                data-testid="mobile-nav-gifts"
              >
                Gifts
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
