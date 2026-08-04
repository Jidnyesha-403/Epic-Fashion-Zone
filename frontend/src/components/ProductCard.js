import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";

export const ProductCard = ({ product, onAddToWishlist }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.some(item => item.id === product.id));
  }, [product.id]);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (isInWishlist) {
      const updated = wishlist.filter(item => item.id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsInWishlist(false);
    } else {
      wishlist.push(product);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsInWishlist(true);
      if (onAddToWishlist) onAddToWishlist();
    }
  };

  return (
    <Link to={`/products/${product.id}`} data-testid={`product-card-${product.id}`}>
      <div className="product-card group relative bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md">
        <div className="relative overflow-hidden aspect-[3/4] bg-stone-100">
          <img
            src={product.images[0]}
            alt={product.name}
            className="product-image w-full h-full object-cover"
          />
          <button
            onClick={handleWishlistClick}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all z-10"
            data-testid={`wishlist-btn-${product.id}`}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-orange-600 text-orange-600' : 'text-stone-600'}`}
            />
          </button>
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute bottom-4 left-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium" data-testid={`low-stock-badge-${product.id}`}>
              Only {product.stock} left
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute bottom-4 left-4 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-medium" data-testid={`out-of-stock-badge-${product.id}`}>
              Out of Stock
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-stone-900 mb-1 line-clamp-1" data-testid={`product-name-${product.id}`}>{product.name}</h3>
          <p className="text-sm text-stone-500 mb-2 line-clamp-1">{product.category}</p>
          <div className="flex items-center justify-between">
            <span className="font-outfit font-semibold text-lg text-stone-900" data-testid={`product-price-${product.id}`}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.stock > 0 && (
              <span className="text-xs text-emerald-600 font-medium" data-testid={`in-stock-badge-${product.id}`}>In Stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
