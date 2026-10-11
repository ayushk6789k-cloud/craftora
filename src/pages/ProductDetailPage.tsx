import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  ArrowLeft,
  Store,
  Clock,
  Scissors,
  MessageSquare,
} from 'lucide-react';
import { Product, Review, formatPaise } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';
import { StarRating } from '../components/StarRating';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectArtisan: (artisanId: string) => void;
  onCheckoutDirect: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product: initialProduct,
  onBack,
  onSelectArtisan,
  onCheckoutDirect,
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const isLiked = isInWishlist(product.id);

  // Fetch full product details and reviews
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiRequest(`/products/${product.id}`);
        if (res.success && res.data) {
          setProduct(res.data.product);
          setReviews(res.data.reviews || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetails();
  }, [product.id]);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            id: '1',
            product_id: product.id,
            image_url:
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
            is_primary: true,
            display_order: 1,
          },
        ];

  const discountPercent =
    product.base_price > product.selling_price
      ? Math.round(((product.base_price - product.selling_price) / product.base_price) * 100)
      : 0;

  const handleAddToCart = async () => {
    if (product.stock_quantity <= 0) return;
    setIsAdding(true);
    await addToCart(product.id, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    if (product.stock_quantity <= 0) return;
    await addToCart(product.id, quantity);
    onCheckoutDirect();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    setReviewSubmitting(true);
    try {
      const res = await apiRequest(`/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: newReviewRating,
          comment: newReviewComment.trim(),
        }),
      });

      if (res.success && res.data) {
        setReviews([res.data.review, ...reviews]);
        setNewReviewComment('');
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-[#D9B99B]/50 hover:bg-[#FAF7F2] text-[#29231F] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>
        <span className="text-xs text-neutral-400">/</span>
        <span className="text-xs text-[#7A4B35] font-medium">{product.category?.name}</span>
        <span className="text-xs text-neutral-400">/</span>
        <span className="text-xs text-neutral-600 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Product Hero Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-24 shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#7A4B35] shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image */}
          <div className="flex-1 rounded-3xl overflow-hidden border border-[#D9B99B]/30 bg-[#FAF7F2] aspect-square relative shadow-xs">
            <img
              src={images[activeImageIndex]?.image_url || images[0].image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#B77948] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-xs text-[#29231F] hover:text-[#B77948] shadow-md transition cursor-pointer"
            >
              <Heart
                size={20}
                className={isLiked ? 'fill-red-500 text-red-500' : 'text-[#7A4B35]'}
              />
            </button>
          </div>
        </div>

        {/* Right: Purchasing Details */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Seller Studio Bar */}
            {product.seller && (
              <div
                onClick={() => onSelectArtisan(product.seller!.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 hover:border-[#7A4B35] transition cursor-pointer"
              >
                <img
                  src={product.seller.logo_url}
                  alt={product.seller.store_name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#D9B99B]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#29231F] truncate">
                      {product.seller.store_name}
                    </span>
                    {product.seller.is_verified && (
                      <ShieldCheck size={14} className="text-[#B77948]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#7A4B35] truncate">{product.seller.tagline}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#7A4B35] underline">
                  Visit Studio
                </span>
              </div>
            )}

            {/* Title & SKU */}
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span>{product.category?.name}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#29231F]">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.average_rating} count={product.review_count} size="md" />
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-xs text-neutral-600">
                {product.review_count} Verified Artisan Reviews
              </span>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/30 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-[#29231F]">
                {formatPaise(product.selling_price)}
              </span>
              {product.base_price > product.selling_price && (
                <span className="text-sm text-neutral-400 line-through font-medium">
                  {formatPaise(product.base_price)}
                </span>
              )}
              <span className="text-xs text-emerald-800 font-semibold ml-auto">
                Inclusive of all taxes
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-[#29231F]/80 leading-relaxed">
              {product.short_description}
            </p>

            {/* Artisan Badges / Techniques */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-[#D9B99B]/30 bg-white">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                  Material
                </span>
                <span className="font-semibold text-[#29231F]">{product.material}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#D9B99B]/30 bg-white">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                  Technique
                </span>
                <span className="font-semibold text-[#29231F]">
                  {product.handmade_technique || 'Hand-assembled'}
                </span>
              </div>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2 text-xs">
              {product.stock_quantity > 0 ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-900">
                    In Stock ({product.stock_quantity} units available)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-semibold text-red-700">Currently Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock_quantity > 0 && (
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold text-[#29231F]">Quantity:</span>
                <div className="flex items-center border border-[#D9B99B]/60 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 font-bold transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-[#29231F]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 font-bold transition cursor-pointer disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-[#D9B99B]/30">
            <div className="grid grid-cols-2 gap-3">
              <button
                id="product-add-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0 || isAdding}
                className="bg-[#7A4B35] hover:bg-[#B77948] text-white py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                {isAdding ? 'Adding...' : 'Add to Bag'}
              </button>

              <button
                id="product-buy-now-btn"
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0}
                className="bg-[#29231F] hover:bg-black text-white py-3.5 px-4 rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Guarantees */}
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#D9B99B]/30 space-y-1.5 text-[11px] text-neutral-600">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#7A4B35]" />
                <span>Free delivery on orders over ₹999 across India</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#7A4B35]" />
                <span>Dispatch time: {product.processing_time_days} days (Artisan hand-packed)</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} className="text-[#7A4B35]" />
                <span>7-Day Replacement for any transit craft defect</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Description & Craft Story Tabs */}
      <div className="bg-white rounded-3xl p-8 border border-[#D9B99B]/30 space-y-6">
        <h2 className="font-display text-xl font-bold text-[#29231F] pb-3 border-b border-[#D9B99B]/20">
          Craft Story & Specifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35] mb-2">
              The Artisan Story
            </h3>
            <p className="text-xs sm:text-sm text-[#29231F]/80 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35]">
              Care & Handling
            </h3>
            <p className="text-xs sm:text-sm text-[#29231F]/80 leading-relaxed bg-[#FAF7F2] p-4 rounded-2xl border border-[#D9B99B]/30">
              {product.care_instructions || 'Keep away from moisture, store in dry pouch.'}
            </p>

            <div className="space-y-1 text-xs text-neutral-600">
              {product.dimensions && (
                <p>
                  <strong>Dimensions:</strong> {product.dimensions}
                </p>
              )}
              {product.weight_grams && (
                <p>
                  <strong>Approx Weight:</strong> {product.weight_grams} grams
                </p>
              )}
              <p>
                <strong>Color Palette:</strong> {product.color}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#D9B99B]/30 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9B99B]/30">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#29231F]">
              Artisan Community Feedback
            </h2>
            <p className="text-xs text-[#29231F]/70 mt-1">
              Verified experiences from buyers supporting our campus artisans.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StarRating rating={product.average_rating} count={reviews.length} size="lg" />
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-2xl border border-[#D9B99B]/40 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A4B35]">
            Leave an Artisan Review
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#29231F]">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReviewRating(star)}
                  className="text-[#B77948] p-1 cursor-pointer"
                >
                  <StarRating rating={star <= newReviewRating ? 5 : 0} showText={false} size="md" />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={newReviewComment}
            onChange={(e) => setNewReviewComment(e.target.value)}
            placeholder="Share what you love about this handmade piece (craftsmanship, colors, packaging)..."
            className="w-full text-xs p-3 rounded-xl border border-[#D9B99B]/50 focus:outline-none focus:border-[#7A4B35] resize-none"
          />

          <div className="flex justify-between items-center">
            {reviewSuccess && (
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                <Check size={14} /> Review submitted! Thank you.
              </span>
            )}
            <button
              type="submit"
              disabled={reviewSubmitting || !newReviewComment.trim()}
              className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-5 py-2.5 rounded-xl text-xs font-bold ml-auto transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {reviewSubmitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">
              No reviews yet. Be the first to review this handcrafted treasure!
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-[#D9B99B]/30 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#29231F]">{rev.user_name}</span>
                    {rev.is_verified_purchase && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-medium">
                        Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={rev.rating} showText={false} size="sm" />
                <p className="text-xs text-[#29231F]/80 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
