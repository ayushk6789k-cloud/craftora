import React, { useState } from 'react';
import { Heart, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { Product, formatPaise } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, isLoading } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const isLiked = isInWishlist(product.id);
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.is_primary)?.image_url || product.images[0].image_url
      : 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80';

  const discountPercent =
    product.base_price > product.selling_price
      ? Math.round(((product.base_price - product.selling_price) / product.base_price) * 100)
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock_quantity <= 0) return;
    const res = await addToCart(product.id, 1);
    if (res.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1800);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect?.(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-[#D9B99B]/30 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF7F2]">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {discountPercent > 0 && (
            <span className="bg-[#B77948] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
              {discountPercent}% OFF
            </span>
          )}
          {product.customization_available && (
            <span className="bg-white/95 text-[#7A4B35] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-xs border border-[#D9B99B]/50 flex items-center gap-1">
              <Sparkles size={10} /> Custom
            </span>
          )}
          {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-300">
              Only {product.stock_quantity} left
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="bg-neutral-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={handleToggleWishlist}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-[#29231F] hover:text-[#B77948] hover:scale-110 transition shadow-xs"
        >
          <Heart
            size={16}
            className={isLiked ? 'fill-red-500 text-red-500' : 'text-[#7A4B35]'}
          />
        </button>

        {/* Quick Add overlay button */}
        <button
          id={`quick-add-btn-${product.id}`}
          onClick={handleAddToCart}
          disabled={product.stock_quantity <= 0 || isLoading}
          className={`absolute bottom-3 inset-x-3 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
            isAdded
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-[#7A4B35] text-white hover:bg-[#B77948] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-md'
          } ${product.stock_quantity <= 0 ? 'hidden' : ''}`}
        >
          {isAdded ? (
            <>
              <Check size={14} /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag size={14} /> Add to Cart
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Artisan & Category */}
          <div className="flex items-center justify-between text-xs text-[#29231F]/60 mb-1">
            <span className="truncate max-w-[140px] font-medium text-[#7A4B35]">
              {product.seller?.store_name || 'Handmade Studio'}
            </span>
            <span className="truncate">{product.category?.name || 'Accessories'}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-[#29231F] line-clamp-1 group-hover:text-[#7A4B35] transition-colors">
            {product.name}
          </h3>

          {/* Material & Craft */}
          <p className="text-xs text-[#29231F]/70 line-clamp-1 mt-0.5">
            {product.material}
          </p>
        </div>

        {/* Price & Rating */}
        <div className="mt-3 pt-2.5 border-t border-[#D9B99B]/20 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[#29231F]">
              {formatPaise(product.selling_price)}
            </span>
            {product.base_price > product.selling_price && (
              <span className="text-xs text-[#29231F]/45 line-through">
                {formatPaise(product.base_price)}
              </span>
            )}
          </div>
          <StarRating rating={product.average_rating} count={product.review_count} size="sm" />
        </div>
      </div>
    </div>
  );
};
