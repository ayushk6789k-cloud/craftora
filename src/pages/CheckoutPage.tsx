import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPaise } from '../types';
import { apiRequest } from '../services/api';
import { RazorpayModal } from '../components/RazorpayModal';

interface CheckoutPageProps {
  initialCoupon?: string;
  onBackToCart: () => void;
  onOrderSuccess: (orderId: string, orderNumber: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  initialCoupon,
  onBackToCart,
  onOrderSuccess,
}) => {
  const { items, refreshCart } = useCart();
  const { user } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || 'Priya Desai');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [email, setEmail] = useState(user?.email || 'priya@example.com');
  const [addressLine1, setAddressLine1] = useState('Flat 402, Lotus Apartments, MG Road');
  const [addressLine2, setAddressLine2] = useState('Near Campus Central Gate');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [postalCode, setPostalCode] = useState('380009');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'demo_payment' | 'razorpay' | 'cod'>('demo_payment');
  const [paymentConfig, setPaymentConfig] = useState<{
    payment_mode: 'demo' | 'razorpay';
    is_demo: boolean;
    razorpay_enabled: boolean;
    disclaimer: string;
  } | null>(null);

  // Calculation state
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Razorpay simulation state
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [paymentOrderData, setPaymentOrderData] = useState<any>(null);

  // Fetch payment configuration from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiRequest('/payments/config');
        if (res.success && res.data) {
          setPaymentConfig(res.data);
          if (res.data.is_demo) {
            setPaymentMethod('demo_payment');
          } else if (res.data.razorpay_enabled) {
            setPaymentMethod('razorpay');
          }
        }
      } catch (e) {
        console.error('Failed to load payment config', e);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const calc = async () => {
      try {
        const res = await apiRequest('/orders/calculate', {
          method: 'POST',
          body: JSON.stringify({
            items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
            coupon_code: initialCoupon,
          }),
        });
        if (res.success) {
          setCalculation(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    calc();
  }, [items, initialCoupon]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate 6-digit Indian PIN
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(postalCode.trim())) {
      setError('Please provide a valid 6-digit Indian Postal PIN code.');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim()) {
      setError('Please complete all required address fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order and reserve stock atomically on server
      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_address: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            postal_code: postalCode.trim(),
            country: 'India',
          },
          payment_method: paymentMethod,
          coupon_code: initialCoupon,
          notes: notes.trim(),
        }),
      });

      if (!res.success || !res.data?.order) {
        setError(res.error || 'Failed to place handcrafted order.');
        setLoading(false);
        return;
      }

      const order = res.data.order;
      setCreatedOrder(order);

      if (paymentMethod === 'cod') {
        // Instant confirmed for Cash on Delivery
        await refreshCart();
        onOrderSuccess(order.id, order.order_number);
      } else {
        // Online / Demo Payment Flow: Request payment order parameters
        try {
          const createOrderRes = await apiRequest('/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ order_id: order.id }),
          });
          if (createOrderRes.success && createOrderRes.data) {
            setPaymentOrderData(createOrderRes.data);
          }
        } catch (e) {
          console.warn('Payment order creation warning:', e);
        }
        setShowRazorpayModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpaySuccess = async (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    is_demo_simulation?: boolean;
  }) => {
    try {
      const verifyRes = await apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          order_id: createdOrder.id,
          ...paymentDetails,
          is_demo_simulation: paymentConfig?.is_demo ?? true,
        }),
      });

      if (verifyRes.success) {
        setShowRazorpayModal(false);
        await refreshCart();
        onOrderSuccess(createdOrder.id, createdOrder.order_number);
      } else {
        throw new Error(verifyRes.error || 'Payment verification failed.');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        onClick={onBackToCart}
        className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#7A4B35] hover:underline cursor-pointer"
      >
        <ArrowLeft size={16} /> Return to Shopping Bag
      </button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#29231F]">Artisan Checkout</h1>
        <p className="text-xs text-[#29231F]/70 mt-1">
          Complete your delivery details to reserve and dispatch your handmade order.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
          <strong>Order Issue:</strong> {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Address and Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Shipping Address */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D9B99B]/20">
              <Truck size={18} className="text-[#7A4B35]" />
              <h2 className="font-display text-lg font-bold text-[#29231F]">
                1. Delivery Destination (India)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#29231F]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#29231F]">Street Address / House / Flat *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House/Apartment no, Street, Landmark"
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#29231F]">Locality / Campus Wing / Landmark</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">PIN Code (6 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 380009"
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Country</label>
                <input
                  type="text"
                  disabled
                  value="India"
                  className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-600"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[#29231F]">Special Maker Note / Custom Note</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Leave a message for the student maker (gift packaging, custom initials, etc.)"
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D9B99B]/20">
              <CreditCard size={18} className="text-[#7A4B35]" />
              <h2 className="font-display text-lg font-bold text-[#29231F]">
                2. Select Payment Mode
              </h2>
            </div>

            <div className="space-y-3">
              {/* Academic Demo Payment Option (Enabled when PAYMENT_MODE=demo) */}
              {(!paymentConfig || paymentConfig.is_demo) && (
                <label
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    paymentMethod === 'demo_payment'
                      ? 'border-[#7A4B35] bg-[#FAF7F2]'
                      : 'border-[#D9B99B]/40 hover:border-[#7A4B35]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="demo_payment"
                    checked={paymentMethod === 'demo_payment'}
                    onChange={() => setPaymentMethod('demo_payment')}
                    className="mt-1 accent-[#7A4B35]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#29231F]">
                        Demo Online Payment (Academic Simulation - UPI, Cards, NetBanking)
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded">
                        ACADEMIC DEMO
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1">
                      Simulated transaction for college evaluation. Zero real money involved. Tests full atomic inventory reservation, checkout, and artisan order fulfillment.
                    </p>
                  </div>
                </label>
              )}

              {/* Razorpay Option (Available when Razorpay mode is configured) */}
              {paymentConfig?.razorpay_enabled && (
                <label
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#7A4B35] bg-[#FAF7F2]'
                      : 'border-[#D9B99B]/40 hover:border-[#7A4B35]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-[#7A4B35]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#29231F]">
                        Razorpay Gateway (UPI, Cards, NetBanking)
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                        TEST MODE
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Instant verification with bank-grade 256-bit encryption.
                    </p>
                  </div>
                </label>
              )}

              {/* Cash on Delivery Option */}
              <label
                className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                  paymentMethod === 'cod'
                    ? 'border-[#7A4B35] bg-[#FAF7F2]'
                    : 'border-[#D9B99B]/40 hover:border-[#7A4B35]/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#7A4B35]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#29231F]">
                      Cash on Delivery (Pay upon arrival)
                    </span>
                    <Banknote size={16} className="text-neutral-500" />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Pay the delivery executive directly when your handcrafted package arrives.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Review & Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 space-y-6 shadow-xs sticky top-24">
            <h2 className="font-display text-lg font-bold text-[#29231F] pb-3 border-b border-[#D9B99B]/20">
              Items in this Order ({items.length})
            </h2>

            {/* Micro items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-neutral-100 text-xs">
              {items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        item.product?.images?.[0]?.image_url ||
                        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100'
                      }
                      alt={item.product?.name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#FAF7F2] shrink-0"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100';
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#29231F] truncate">{item.product?.name}</p>
                      <p className="text-[10px] text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#29231F] shrink-0">
                    {formatPaise(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-[#D9B99B]/20 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#29231F]">
                  {formatPaise(calculation?.subtotal || 0)}
                </span>
              </div>

              {calculation?.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatPaise(calculation.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Standard Delivery</span>
                <span className="font-semibold text-[#29231F]">
                  {calculation?.shipping_amount === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPaise(calculation?.shipping_amount || 0)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-[#D9B99B]/30 flex justify-between text-base font-bold text-[#29231F]">
                <span>Total Amount</span>
                <span className="text-xl text-[#7A4B35]">
                  {formatPaise(calculation?.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="checkout-confirm-btn"
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Lock size={15} />
              {loading ? (
                'Reserving Stock & Initializing...'
              ) : paymentMethod === 'demo_payment' ? (
                `Proceed to Demo Pay (${formatPaise(calculation?.total_amount || 0)})`
              ) : paymentMethod === 'razorpay' ? (
                `Proceed to Razorpay (${formatPaise(calculation?.total_amount || 0)})`
              ) : (
                'Confirm Order (Cash on Delivery)'
              )}
            </button>

            <p className="text-[10px] text-center text-neutral-500">
              By confirming, you support an Indian student artisan directly with transparent pricing.
            </p>
          </div>
        </div>
      </form>

      {/* Interactive Payment Verification Modal */}
      {createdOrder && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          orderId={createdOrder.id}
          orderNumber={createdOrder.order_number}
          amount={createdOrder.total_amount}
          customerName={createdOrder.shipping_name}
          customerEmail={email}
          customerPhone={phone}
          isDemo={paymentConfig?.is_demo ?? true}
          paymentMode={paymentConfig?.payment_mode ?? 'demo'}
          razorpayOrderId={paymentOrderData?.razorpay_order_id}
          onSuccess={handleRazorpaySuccess}
          onClose={() => setShowRazorpayModal(false)}
        />
      )}
    </div>
  );
};
