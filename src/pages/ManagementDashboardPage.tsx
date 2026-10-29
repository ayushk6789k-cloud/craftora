import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Tag,
  ArrowUpRight,
  ShieldCheck,
  Briefcase,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { formatPaise } from '../types';
import { apiRequest } from '../services/api';

export const ManagementDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New coupon modal / form
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrder, setMinOrder] = useState('500');
  const [couponCreated, setCouponCreated] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/management/analytics');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/management/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: parseInt(discountValue, 10),
          min_order_amount: parseInt(minOrder, 10),
        }),
      });
      if (res.success) {
        setCouponCreated(true);
        setNewCode('');
        fetchAnalytics();
        setTimeout(() => setCouponCreated(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-24 bg-neutral-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const vendorBreakdown = data?.vendorBreakdown || [];
  const coupons = data?.couponPerformance || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7A4B35] text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <Briefcase size={28} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77948]">
              Management Studies (MGT) Portal
            </span>
            <h1 className="font-display text-2xl font-bold text-[#29231F]">
              Marketplace Economics & Financial Control
            </h1>
            <p className="text-xs text-[#29231F]/70">
              Campus venture analytics, commission reconciliations, and promo performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="bg-white border border-[#D9B99B]/50 hover:bg-[#FAF7F2] text-[#29231F] text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Merchandise (GMV)</span>
            <TrendingUp size={16} className="text-[#7A4B35]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">
            {formatPaise(kpis.gmv || 0)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">100% customer volume</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Platform Take (10%)</span>
            <Percent size={16} className="text-[#B77948]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#7A4B35]">
            {formatPaise(kpis.platformCommissionRevenue || 0)}
          </p>
          <p className="text-[11px] text-neutral-400">Campus infrastructure revenue</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Artisan Disbursements</span>
            <Users size={16} className="text-emerald-700" />
          </div>
          <p className="font-display text-2xl font-bold text-emerald-700">
            {formatPaise(kpis.artisanDisbursements || 0)}
          </p>
          <p className="text-[11px] text-neutral-400">90% net to student creators</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Order Value</span>
            <DollarSign size={16} className="text-blue-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">
            {formatPaise(kpis.averageOrderValue || 0)}
          </p>
          <p className="text-[11px] text-neutral-400">Total {kpis.totalOrders || 0} orders</p>
        </div>
      </div>

      {/* Vendor Reconciliation Breakdown */}
      <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="font-display text-xl font-bold text-[#29231F]">
            Artisan Studio Settlements & Commission Ledger
          </h2>
          <p className="text-xs text-neutral-500">
            Real-time split calculation enforcing 90% direct artisan payout and 10% platform reinvestment.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <th className="pb-3">Artisan Studio</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Orders</th>
                <th className="pb-3 text-right">Gross GMV</th>
                <th className="pb-3 text-right">Platform Fee (10%)</th>
                <th className="pb-3 text-right">Artisan Payout (90%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {vendorBreakdown.map((vb: any) => (
                <tr key={vb.seller_id} className="hover:bg-[#FAF7F2] transition">
                  <td className="py-3 font-semibold text-[#29231F]">{vb.store_name}</td>
                  <td className="py-3 text-neutral-500">
                    {vb.city}, {vb.state}
                  </td>
                  <td className="py-3 text-neutral-700">{vb.ordersCount}</td>
                  <td className="py-3 text-right font-semibold text-[#29231F]">
                    {formatPaise(vb.grossSales)}
                  </td>
                  <td className="py-3 text-right font-medium text-[#7A4B35]">
                    {formatPaise(vb.commissionCollected)}
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-700">
                    {formatPaise(vb.artisanPayout)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Campaign Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Promos List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              Marketing Promotion Performance
            </h2>
            <p className="text-xs text-neutral-500">
              Active coupons tracked by the Management team for promotional conversions.
            </p>
          </div>

          <div className="space-y-3">
            {coupons.map((c: any) => (
              <div
                key={c.code}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#7A4B35] bg-white px-2 py-0.5 rounded border border-[#D9B99B]/50">
                      {c.code}
                    </span>
                    <span className="text-neutral-600">
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}% Discount`
                        : `${formatPaise(c.discount_value)} Flat Off`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Used {c.uses_count} times • Min order {formatPaise(c.min_order_amount)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Total Given</span>
                  <span className="font-bold text-[#29231F]">{formatPaise(c.total_discount_given)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Campaign Coupon Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-4 shadow-xs">
          <div>
            <h3 className="font-display text-lg font-bold text-[#29231F]">
              Create New Promotion
            </h3>
            <p className="text-xs text-neutral-500">
              Launch a seasonal campus campaign code.
            </p>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. CAMPUS50, DIWALI15"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Value *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
              />
            </div>

            {couponCreated && (
              <span className="text-xs text-emerald-800 font-semibold block">
                Coupon created and activated!
              </span>
            )}

            <button
              type="submit"
              className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-3 rounded-xl font-bold text-xs transition shadow-md cursor-pointer"
            >
              Activate Campaign Coupon
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
