import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPaise } from '../types';
import { apiRequest } from '../services/api';

interface CartPageProps {
  onProceedToCheckout: (appliedCoupon?: string) => void;
  onExplore: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onProceedToCheckout, onExplore }) => {
  const { items, itemCount, subtotal, updateQuantity, removeFromCart } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState<string | undefined>();
  const [isApplying, setIsApplying] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 99900;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 7900;
  const totalPayable = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplying(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await apiRequest('/orders/calculate', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          coupon_code: couponInput.trim().toUpperCase(),
        }),
      });

      if (res.success && res.data?.applied_coupon) {
        setDiscountAmount(res.data.discount_amount);
        setActiveCoupon(res.data.applied_coupon.code);
        setCouponSuccess(`Coupon ${res.data.applied_coupon.code} applied! Saved ${formatPaise(res.data.discount_amount)}`);
      } else {
        setCouponError('Invalid or expired coupon code for this order.');
        setDiscountAmount(0);
        setActiveCoupon(undefined);
      }
    } catch (e: any) {
      setCouponError(e.message || 'Failed to apply coupon');
    } finally {
      setIsApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#FAF7F2] text-[#7A4B35] flex items-center justify-center mx-auto">
          <ShoppingBag size={36} />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#29231F]">Your Shopping Bag is Empty</h1>
        <p className="text-xs sm:text-sm text-[#29231F]/70 max-w-sm mx-auto">
          Explore handmade jewelry, macramé accessories, and bespoke artisanal treasures crafted by our student creators.
        </p>
        <button
          onClick={onExplore}
          className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
        >
          Explore Handcrafted Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#29231F]">Your Shopping Bag</h1>
        <p className="text-xs text-[#29231F]/70 mt-1">
          Review your handcrafted items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-[#D9B99B]/30 divide-y divide-[#D9B99B]/20 p-6 shadow-xs">
            {items.map((item) => {
              const prod = item.product;
              const img =
                prod?.images?.[0]?.image_url ||
                'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';

              return (
                <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
                  <img
                    src={img}
                    alt={prod?.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-[#D9B99B]/30 bg-[#FAF7F2] shrink-0"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = 'true';
                        target.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80';
                      }
                    }}
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-[#7A4B35] uppercase tracking-wider">
                            {prod?.seller?.store_name}
                          </span>
                          <h3 className="font-bold text-sm sm:text-base text-[#29231F] mt-0.5">
                            {prod?.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-600 transition p-1.5 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{prod?.material}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-[#D9B99B]/50 rounded-xl overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 px-2.5 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer font-bold"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-3 text-xs font-bold text-[#29231F]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={prod ? item.quantity >= prod.stock_quantity : false}
                            className="p-1.5 px-2.5 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer font-bold disabled:opacity-30"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {formatPaise(item.unit_price)} each
                        </span>
                      </div>

                      <span className="font-bold text-sm sm:text-base text-[#29231F]">
                        {formatPaise(item.total_price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Note */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/30 flex items-center gap-3 text-xs text-neutral-600">
            <Truck size={18} className="text-[#7A4B35] shrink-0" />
            <span>
              Orders are packaged in eco-friendly cotton bags and dispatched directly by student makers within 48 hours.
            </span>
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 space-y-6 shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#29231F] pb-3 border-b border-[#D9B99B]/20">
              Order Summary
            </h2>

            {/* Coupon Application */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A4B35] block">
                Have a Coupon Code?
              </label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Try WELCOME10 or CAMPUS20"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full uppercase text-xs pl-8 pr-3 py-2.5 rounded-xl border border-[#D9B99B]/50 focus:outline-none focus:border-[#7A4B35]"
                  />
                  <Tag size={14} className="absolute left-2.5 top-3 text-neutral-400" />
                </div>
                <button
                  type="submit"
                  disabled={isApplying || !couponInput.trim()}
                  className="bg-[#29231F] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                >
                  {isApplying ? 'Checking...' : 'Apply'}
                </button>
              </form>
              {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
              {couponSuccess && <p className="text-[11px] text-emerald-700 font-medium">{couponSuccess}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#29231F]/70">
                <span>Subtotal</span>
                <span className="font-semibold text-[#29231F]">{formatPaise(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({activeCoupon})</span>
                  <span>-{formatPaise(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#29231F]/70">
                <span>Standard Delivery</span>
                <span className="font-semibold text-[#29231F]">
                  {shippingCost === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPaise(shippingCost)
                  )}
                </span>
              </div>

              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Add {formatPaise(FREE_SHIPPING_THRESHOLD - subtotal)} more to qualify for Free Delivery!
                </p>
              )}

              <div className="pt-3 border-t border-[#D9B99B]/30 flex justify-between text-base font-bold text-[#29231F]">
                <span>Total Amount</span>
                <span className="text-lg text-[#7A4B35]">{formatPaise(totalPayable)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              id="proceed-to-checkout-btn"
              onClick={() => onProceedToCheckout(activeCoupon)}
              className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Direct Student Support • 100% Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
