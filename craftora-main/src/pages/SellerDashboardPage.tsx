import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Truck,
  CheckCircle2,
  Store,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Product, SellerOrder, formatPaise } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'storefront'>('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('cat_1');
  const [shortDesc, setShortDesc] = useState('');
  const [sellingPrice, setSellingPrice] = useState('499');
  const [basePrice, setBasePrice] = useState('599');
  const [costPrice, setCostPrice] = useState('200');
  const [stockQty, setStockQty] = useState('10');
  const [material, setMaterial] = useState('Terracotta Clay');
  const [technique, setTechnique] = useState('Kiln Fired & Hand Painted');
  const [care, setCare] = useState('Keep dry, wipe with cotton cloth.');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfillment update
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('India Post Handcraft Wing');

  // Storefront form
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [instagram, setInstagram] = useState('');
  const [storeSaved, setStoreSaved] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, prodsRes, ordsRes, catsRes] = await Promise.all([
        apiRequest('/seller/dashboard'),
        apiRequest('/seller/products'),
        apiRequest('/seller/orders'),
        apiRequest('/categories'),
      ]);

      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
        if (dashRes.data.store) {
          setStoreName(dashRes.data.store.store_name);
          setTagline(dashRes.data.store.tagline);
          setStory(dashRes.data.store.story);
          setCity(dashRes.data.store.city);
          setState(dashRes.data.store.state);
          setInstagram(dashRes.data.store.instagram_handle || '');
        }
      }
      if (prodsRes.success && prodsRes.data) {
        setProducts(prodsRes.data.products || []);
      }
      if (ordsRes.success && ordsRes.data) {
        setOrders(ordsRes.data.orders || []);
      }
      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiRequest('/seller/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category_id: categoryId,
          short_description: shortDesc,
          selling_price: sellingPrice,
          base_price: basePrice,
          cost_price: costPrice,
          stock_quantity: stockQty,
          material,
          handmade_technique: technique,
          care_instructions: care,
          images: [imageUrl],
        }),
      });

      if (res.success && res.data?.product) {
        setProducts([res.data.product, ...products]);
        setShowAddModal(false);
        // Reset
        setName('');
        setShortDesc('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFulfillment = async (sellerOrderId: string, status: string) => {
    try {
      const res = await apiRequest(`/seller/orders/${sellerOrderId}/fulfillment`, {
        method: 'PATCH',
        body: JSON.stringify({
          fulfillment_status: status,
          tracking_number: trackingNumber || `IND-CRF-${Math.floor(100000 + Math.random() * 900000)}`,
          shipping_carrier: carrier,
        }),
      });

      if (res.success) {
        setOrders(
          orders.map((o) =>
            o.id === sellerOrderId
              ? { ...o, fulfillment_status: status, tracking_number: trackingNumber || o.tracking_number }
              : o
          )
        );
        setUpdatingOrderId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/seller/storefront', {
        method: 'PATCH',
        body: JSON.stringify({
          store_name: storeName,
          tagline,
          story,
          city,
          state,
          instagram_handle: instagram,
        }),
      });
      if (res.success) {
        setStoreSaved(true);
        setTimeout(() => setStoreSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Studio Header */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7A4B35] text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <Store size={30} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77948]">
              Fashion Design (FD) Artisan Portal
            </span>
            <h1 className="font-display text-2xl font-bold text-[#29231F]">
              {dashboardData?.store?.store_name || 'Artisan Studio'}
            </h1>
            <p className="text-xs text-[#29231F]/70">
              {dashboardData?.store?.tagline || 'Student Handcrafted Accessories Creator'}
            </p>
          </div>
        </div>

        {/* Portal Nav */}
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-[#D9B99B]/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'products' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            My Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('storefront')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'storefront' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            Studio Profile
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {dashboardData?.lowStockAlerts && dashboardData.lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold">Artisan Inventory Attention Required</p>
            <p className="text-amber-800 mt-0.5">
              {dashboardData.lowStockAlerts.length} handcrafted pieces are running low in stock. Restock or adjust inventory to prevent overselling.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Gross Sales
              </span>
              <p className="font-display text-2xl font-bold text-[#7A4B35]">
                {formatPaise(dashboardData?.stats?.grossSales || 0)}
              </p>
              <p className="text-[11px] text-neutral-400">Total customer orders</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Artisan Net Payout
              </span>
              <p className="font-display text-2xl font-bold text-emerald-700">
                {formatPaise(dashboardData?.stats?.estimatedEarnings || 0)}
              </p>
              <p className="text-[11px] text-neutral-400">90% vendor proceeds</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Pending Orders
              </span>
              <p className="font-display text-2xl font-bold text-[#29231F]">
                {dashboardData?.stats?.pendingOrdersCount || 0}
              </p>
              <p className="text-[11px] text-neutral-400">Awaiting dispatch</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Active Listings
              </span>
              <p className="font-display text-2xl font-bold text-[#29231F]">
                {dashboardData?.stats?.activeProducts || 0}
              </p>
              <p className="text-[11px] text-neutral-400">In marketplace catalog</p>
            </div>
          </div>

          {/* Recent Orders in Studio */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/30 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9B99B]/20">
              <h2 className="font-display text-lg font-bold text-[#29231F]">
                Recent Studio Orders
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-[#7A4B35] hover:underline cursor-pointer"
              >
                View All Fulfillment
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No studio orders placed yet.</p>
            ) : (
              <div className="divide-y divide-neutral-100 text-xs">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#29231F]">{ord.order_number}</p>
                      <p className="text-[11px] text-neutral-500">
                        {ord.shipping_city} • {ord.items?.length || 1} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#7A4B35]">{formatPaise(ord.seller_payout_amount)}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FAF7F2] text-neutral-700">
                        {ord.fulfillment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#29231F]">
                Handcrafted Catalog Listings
              </h2>
              <p className="text-xs text-[#29231F]/70">
                Manage your jewelry, textiles, and artisanal accessories.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus size={15} /> Add New Handcrafted Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-[#D9B99B]/40 p-5 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="flex gap-4">
                  <img
                    src={p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200'}
                    alt={p.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-[#FAF7F2] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#7A4B35]">
                      {p.category?.name}
                    </span>
                    <h3 className="font-bold text-xs text-[#29231F] truncate mt-0.5">{p.name}</h3>
                    <p className="font-bold text-xs text-[#29231F] mt-1">{formatPaise(p.selling_price)}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.stock_quantity <= p.low_stock_threshold
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Stock: {p.stock_quantity} units
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 text-xs flex justify-between items-center text-neutral-500">
                  <span>SKU: {p.sku}</span>
                  <span className="capitalize font-semibold text-[#7A4B35]">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Orders Fulfillment */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              Fulfillment & Dispatch Desk
            </h2>
            <p className="text-xs text-[#29231F]/70">
              Update shipment tracking details as you pack each handmade order.
            </p>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-neutral-500 italic bg-white p-8 rounded-3xl border border-[#D9B99B]/30 text-center">
              No orders assigned to your studio yet.
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((so) => (
                <div
                  key={so.id}
                  className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 space-y-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 text-xs">
                    <div>
                      <span className="font-bold text-sm text-[#29231F]">{so.order_number}</span>
                      <span className="text-[11px] text-neutral-500 block">
                        Customer: {so.shipping_name} ({so.shipping_city}, {so.shipping_state})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block">Your Payout</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatPaise(so.seller_payout_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Line items in this sub-order */}
                  <div className="space-y-1 text-xs text-neutral-600">
                    {so.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.product_name} (Qty: {it.quantity})
                        </span>
                        <span className="font-semibold">{formatPaise(it.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status update controls */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Current Status:</span>
                      <span className="font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A4B35] border border-[#D9B99B]/40">
                        {so.fulfillment_status}
                      </span>
                      {so.tracking_number && (
                        <span className="text-neutral-500 text-[11px]">
                          Tracking: {so.tracking_number}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {so.fulfillment_status !== 'shipped' && so.fulfillment_status !== 'delivered' && (
                        <button
                          onClick={() => handleUpdateFulfillment(so.id, 'shipped')}
                          className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Truck size={13} /> Mark Shipped
                        </button>
                      )}
                      {so.fulfillment_status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateFulfillment(so.id, 'delivered')}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Storefront Profile */}
      {activeTab === 'storefront' && (
        <form
          onSubmit={handleSaveStorefront}
          className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 sm:p-8 space-y-6 max-w-2xl shadow-xs"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              Artisan Studio Profile
            </h2>
            <p className="text-xs text-neutral-500">
              Customize how conscious buyers see your studio across Craftora.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Studio Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Earth-friendly handmade terracotta jewelry"
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Studio Craft Story *</label>
              <textarea
                rows={4}
                required
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">City / Campus</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Instagram Handle</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. mittistudio_fd"
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {storeSaved && (
              <span className="text-xs text-emerald-800 font-semibold">
                Studio profile saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-md ml-auto cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 my-8 border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="font-display text-xl font-bold text-[#29231F]">
                List Handcrafted Product
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hand-Painted Terracotta Jhumkas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#29231F]">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#29231F]">Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#29231F]">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#29231F]">Base MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#29231F]">Craft Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Material & Color</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Handmade Technique</label>
                <input
                  type="text"
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Product Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Short Craft Description *</label>
                <textarea
                  rows={2}
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Describe dimensions, craft aesthetic, and inspiration..."
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-3.5 rounded-2xl font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Listing Product...' : 'Publish Handcrafted Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
