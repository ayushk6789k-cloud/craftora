import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPaise } from '../types';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
  onProceedToCheckout?: () => void;
  onExplore?: () => void;
  onViewCartPage?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
  onProceedToCheckout,
  onExplore,
  onViewCartPage,
}) => {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  const open = isOpen !== undefined ? isOpen : isCartDrawerOpen;

  const handleClose = () => {
    setIsCartDrawerOpen(false);
    if (onClose) onClose();
  };

  const handleCheckoutAction = () => {
    handleClose();
    if (onProceedToCheckout) onProceedToCheckout();
    else if (onCheckout) onCheckout();
  };

  const handleExploreAction = () => {
    handleClose();
    if (onViewCartPage) onViewCartPage();
    else if (onExplore) onExplore();
  };

  if (!open) return null;

  // ₹999 free shipping threshold (99900 paise)
  const FREE_SHIPPING_THRESHOLD = 99900;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const diffToFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#D9B99B]/30 flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#7A4B35]" />
              <h2 className="text-base font-bold text-[#29231F]">
                Your Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              id="close-cart-drawer-btn"
              onClick={handleClose}
              className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#7A4B35]/5 px-6 py-3 border-b border-[#D9B99B]/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7A4B35] mb-1.5">
              <Truck size={15} />
              {diffToFree === 0 ? (
                <span className="text-emerald-800">You've unlocked Free Standard Delivery!</span>
              ) : (
                <span>Add {formatPaise(diffToFree)} more for Free Shipping</span>
              )}
            </div>
            <div className="w-full bg-[#D9B99B]/30 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7A4B35] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#D9B99B]/20">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#7A4B35] mb-4">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-base font-bold text-[#29231F] mb-1">Your bag is empty</h3>
                <p className="text-xs text-[#29231F]/70 max-w-xs mb-6">
                  Discover unique handcrafted earrings, macrame slings, and artisanal pottery from our campus creators.
                </p>
                <button
                  onClick={handleExploreAction}
                  className="bg-[#7A4B35] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#B77948] transition cursor-pointer"
                >
                  Explore Creations
                </button>
              </div>
            ) : (
              items.map((item) => {
                const prod = item.product;
                const img =
                  prod?.images?.[0]?.image_url ||
                  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';

                return (
                  <div key={item.id} className="py-4 flex gap-4">
                    {/* Thumbnail */}
                    <img
                      src={img}
                      alt={prod?.name || 'Product'}
                      className="w-20 h-20 rounded-xl object-cover border border-[#D9B99B]/30 bg-[#FAF7F2]"
                    />

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-semibold text-[#29231F] line-clamp-1">
                            {prod?.name || 'Handcrafted Item'}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-neutral-400 hover:text-red-600 transition p-1 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#7A4B35] font-medium mt-0.5">
                          {prod?.seller?.store_name}
                        </p>
                        <p className="text-xs font-bold text-[#29231F] mt-1">
                          {formatPaise(item.unit_price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-[#D9B99B]/50 rounded-lg overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-[#29231F]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={prod ? item.quantity >= prod.stock_quantity : false}
                            className="p-1 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-[#29231F]">
                          {formatPaise(item.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#D9B99B]/30 bg-[#FAF7F2] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#29231F]/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#29231F]">{formatPaise(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#29231F]/70">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-emerald-800">
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : formatPaise(7900)}
                  </span>
                </div>
                <div className="border-t border-[#D9B99B]/20 pt-2 flex justify-between text-sm font-bold text-[#29231F]">
                  <span>Total</span>
                  <span className="text-base text-[#7A4B35]">
                    {formatPaise(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 7900))}
                  </span>
                </div>
              </div>

              <button
                id="cart-checkout-btn"
                onClick={handleCheckoutAction}
                className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight size={15} />
              </button>
              <p className="text-[10px] text-center text-neutral-500">
                100% Authentic Handcrafted Items • Direct Support to Student Artisans
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
