import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, Printer, Truck, Home, Database, ShieldCheck } from 'lucide-react';
import { Order, formatPaise } from '../types';
import { apiRequest } from '../services/api';

interface OrderSuccessPageProps {
  orderId: string;
  orderNumber: string;
  onNavigateToAccount: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  orderId,
  orderNumber,
  onNavigateToAccount,
  onContinueShopping,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiRequest(`/orders/${orderId}`);
        if (res.success && res.data) {
          setOrder(res.data.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Hero Badge */}
      <div className="text-center space-y-3 print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#29231F]">
          Order Confirmed & Stored!
        </h1>
        <p className="text-xs sm:text-sm text-[#29231F]/70 max-w-md mx-auto leading-relaxed">
          Order <strong>{orderNumber}</strong> has been saved directly to the database and transmitted to our campus artisan studios.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
          <Database size={13} /> Stored in Supabase PostgreSQL
        </div>
      </div>

      {/* Printable Order Receipt */}
      <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 sm:p-8 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9B99B]/20 text-xs">
          <div>
            <span className="font-display text-xl font-bold text-[#7A4B35] tracking-tight block">CRAFTORA</span>
            <span className="text-[11px] text-neutral-500">Handcrafted Campus Marketplace</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[11px]">Official Tax Invoice / Receipt</span>
            <span className="font-bold text-sm text-[#29231F]">{orderNumber}</span>
            <span className="text-[10px] text-neutral-400 block">
              {order?.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#FAF7F2] rounded-2xl border border-[#D9B99B]/20 text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Order Status</span>
            <span className="font-bold text-emerald-800 uppercase">
              {order?.order_status?.toUpperCase() || 'CONFIRMED'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Payment Status</span>
            <span className="font-bold text-emerald-800 uppercase">
              {order?.payment_status?.toUpperCase() || 'PAID'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Payment Method</span>
            <span className="font-bold text-[#7A4B35] uppercase">
              {order?.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Database Sync</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
        </div>

        {/* Delivery Address Details */}
        {order && (
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D9B99B]/30 space-y-1 text-xs text-[#29231F]/80">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#7A4B35]">
              Delivery Destination
            </h3>
            <p className="font-bold text-sm text-[#29231F]">{order.shipping_name}</p>
            <p>{order.shipping_address_line1}</p>
            {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
            <p>
              {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
            </p>
            <p className="text-neutral-500 pt-1 font-mono">Contact: {order.shipping_phone}</p>
          </div>
        )}

        {/* Itemized list */}
        {order?.items && (
          <div className="space-y-3 divide-y divide-neutral-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#7A4B35] pt-2">
              Purchased Handcrafted Items
            </h3>
            {order.items.map((it) => (
              <div key={it.id} className="pt-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-[#29231F]">{it.product_name}</p>
                  <p className="text-[11px] text-neutral-500">
                    Qty: {it.quantity} × {formatPaise(it.unit_price)}
                  </p>
                </div>
                <span className="font-bold text-[#29231F]">{formatPaise(it.total_price)}</span>
              </div>
            ))}

            <div className="pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPaise(order.subtotal_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Artisan Coupon Discount</span>
                  <span>-{formatPaise(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Campus Delivery Fee</span>
                <span>{order.shipping_amount === 0 ? 'FREE' : formatPaise(order.shipping_amount)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-[#29231F]">
                <span>Total Amount</span>
                <span className="text-base text-[#7A4B35]">{formatPaise(order.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tracking info */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 print:hidden">
          <Truck size={18} className="shrink-0 text-[#7A4B35]" />
          <span>
            You will receive SMS tracking updates once the student artisan finishes crafting and dispatches the parcel.
          </span>
        </div>
      </div>

      {/* Action and Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
        <button
          onClick={handlePrintReceipt}
          className="bg-neutral-800 hover:bg-neutral-900 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Printer size={16} /> Print / Save Tax Receipt
        </button>
        <button
          onClick={onNavigateToAccount}
          className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
        >
          <Package size={16} /> View in My Account Orders
        </button>
        <button
          onClick={onContinueShopping}
          className="bg-white hover:bg-[#FAF7F2] text-[#29231F] border border-[#D9B99B] px-5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home size={16} /> Continue Exploring
        </button>
      </div>
    </div>
  );
};
