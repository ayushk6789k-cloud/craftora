import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Users,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Activity,
  Layers,
  Sparkles,
  Package,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Check,
  X,
  Store,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { Product, formatPaise } from '../types';

export const AdminPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'stores' | 'users'>('stock');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Stock edit modal / quick edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockEditQty, setStockEditQty] = useState<number>(0);
  const [stockEditPrice, setStockEditPrice] = useState<number>(0);
  const [stockEditStatus, setStockEditStatus] = useState<string>('active');
  const [savingStock, setSavingStock] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await apiRequest('/admin/overview');
      if (res.success && res.data) {
        setAdminData(res.data);
      } else {
        setActionError(res.error || 'Failed to load admin console data.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error communicating with administration backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStartEditStock = (prod: Product) => {
    setEditingProductId(prod.id);
    setStockEditQty(prod.stock_quantity);
    setStockEditPrice(Math.round(prod.selling_price / 100));
    setStockEditStatus(prod.status);
  };

  const handleSaveStock = async (prodId: string) => {
    setSavingStock(true);
    setActionError('');
    try {
      const res = await apiRequest(`/admin/products/${prodId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          stock_quantity: Number(stockEditQty),
          selling_price: Number(stockEditPrice) * 100, // convert back to paise
          status: stockEditStatus,
        }),
      });

      if (res.success) {
        setActionSuccess('Stock & pricing updated successfully!');
        setEditingProductId(null);
        await fetchAdminData();
        setTimeout(() => setActionSuccess(''), 3500);
      } else {
        setActionError(res.error || 'Failed to update product stock.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error updating product.');
    } finally {
      setSavingStock(false);
    }
  };

  const handleVerifySeller = async (storeId: string, verify: boolean) => {
    try {
      const res = await apiRequest(`/admin/stores/${storeId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ is_verified: verify }),
      });
      if (res.success) {
        setActionSuccess(`Store ${verify ? 'verified' : 'unverified'} successfully!`);
        await fetchAdminData();
        setTimeout(() => setActionSuccess(''), 3500);
      } else {
        setActionError(res.error || 'Failed to update store verification.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error updating verification.');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (res.success) {
        setActionSuccess(`User role set to ${role}`);
        await fetchAdminData();
        setTimeout(() => setActionSuccess(''), 3500);
      } else {
        setActionError(res.error || 'Failed to update role.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error updating role.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-24 bg-neutral-100 rounded-3xl animate-pulse" />
        <div className="h-96 bg-neutral-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const stats = adminData?.stats || {};
  const products: Product[] = adminData?.products || [];
  const stores = adminData?.stores || [];
  const users = adminData?.users || [];
  const lowStockCount = stats.lowStockCount || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7A4B35] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            <Server size={28} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77948]">
              Platform Administration & Operations
            </span>
            <h1 className="font-display text-2xl font-bold text-[#29231F]">
              Craftora Admin Panel
            </h1>
            <p className="text-xs text-[#29231F]/70">
              Manage product stock, pricing, artisan studio verification, and role assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-white border border-[#D9B99B]/40 hover:bg-[#FAF7F2] text-[#29231F] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <XCircle size={16} className="text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Catalog Inventory</span>
            <Boxes size={18} className="text-[#7A4B35]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">{products.length} Products</p>
          <p className="text-[11px] text-neutral-500">
            {lowStockCount > 0 ? (
              <span className="text-amber-700 font-semibold">{lowStockCount} items low in stock</span>
            ) : (
              'All stock levels optimal'
            )}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Artisan Studios</span>
            <Store size={18} className="text-amber-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">{stores.length} Studios</p>
          <p className="text-[11px] text-neutral-500">
            {stores.filter((s: any) => s.is_verified).length} verified partners
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total GMV</span>
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <p className="font-display text-2xl font-bold text-emerald-700">
            {formatPaise(stats.totalGMV || 0)}
          </p>
          <p className="text-[11px] text-neutral-500">{stats.totalOrders || 0} lifetime orders</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Users</span>
            <Users size={18} className="text-purple-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">{users.length} Users</p>
          <p className="text-[11px] text-neutral-500">In PostgreSQL profiles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D9B99B]/40 gap-3">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'stock'
              ? 'border-[#7A4B35] text-[#7A4B35]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package size={15} /> Manage Stock & Inventory ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'stores'
              ? 'border-[#7A4B35] text-[#7A4B35]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Store size={15} /> Artisan Studios ({stores.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'users'
              ? 'border-[#7A4B35] text-[#7A4B35]'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Users size={15} /> User Roles ({users.length})
        </button>
      </div>

      {/* TAB 1: STOCK MANAGEMENT */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#29231F]">
                Product Inventory & Live Stock Controller
              </h2>
              <p className="text-xs text-neutral-500">
                Adjust physical inventory levels, update selling prices in Rupees, and toggle catalog status instantly.
              </p>
            </div>
            {lowStockCount > 0 && (
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                {lowStockCount} Products Need Restock
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock Units</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((prod) => {
                  const isEditing = editingProductId === prod.id;
                  const isLow = prod.stock_quantity <= (prod.low_stock_threshold || 5);
                  const thumb =
                    prod.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100';

                  return (
                    <tr key={prod.id} className="hover:bg-[#FAF7F2]/60 transition">
                      {/* Product Thumbnail & Name */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={prod.name}
                            className="w-12 h-12 rounded-xl object-cover bg-[#FAF7F2] border border-[#D9B99B]/30 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[#29231F] truncate max-w-xs">{prod.name}</p>
                            <p className="text-[10px] text-[#7A4B35] font-semibold truncate">
                              SKU: {prod.sku} • {prod.seller?.store_name || 'Artisan Studio'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 text-neutral-600">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium">
                          {prod.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Price (View / Edit) */}
                      <td className="py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1 max-w-[110px]">
                            <span className="text-neutral-500 font-bold">₹</span>
                            <input
                              type="number"
                              min="1"
                              value={stockEditPrice}
                              onChange={(e) => setStockEditPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                              className="w-full px-2 py-1 rounded-lg border border-[#7A4B35] text-xs font-bold focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-[#29231F]">{formatPaise(prod.selling_price)}</span>
                        )}
                      </td>

                      {/* Stock Units (View / Edit) */}
                      <td className="py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2 max-w-[100px]">
                            <input
                              type="number"
                              min="0"
                              value={stockEditQty}
                              onChange={(e) => setStockEditQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="w-full px-2 py-1 rounded-lg border border-[#7A4B35] text-xs font-bold focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                                prod.stock_quantity === 0
                                  ? 'bg-red-100 text-red-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {prod.stock_quantity} left
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        {isEditing ? (
                          <select
                            value={stockEditStatus}
                            onChange={(e) => setStockEditStatus(e.target.value)}
                            className="px-2 py-1 bg-white border border-[#7A4B35] rounded-lg text-xs font-semibold focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : (
                          <span
                            className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                              prod.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {prod.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveStock(prod.id)}
                              disabled={savingStock}
                              className="px-3 py-1.5 rounded-xl bg-[#7A4B35] hover:bg-[#B77948] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={13} /> {savingStock ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="p-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditStock(prod)}
                            className="px-3 py-1.5 rounded-xl border border-[#D9B99B]/60 hover:bg-[#FAF7F2] text-[#7A4B35] text-xs font-semibold flex items-center gap-1 transition cursor-pointer ml-auto"
                          >
                            <Edit3 size={12} /> Edit Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ARTISAN STUDIOS */}
      {activeTab === 'stores' && (
        <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              Artisan Studios & Verification
            </h2>
            <p className="text-xs text-neutral-500">
              Grant or revoke verified artisan badges displayed across the marketplace storefront.
            </p>
          </div>

          <div className="space-y-4">
            {stores.map((st: any) => (
              <div
                key={st.id}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={st.logo_url}
                    alt={st.store_name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#D9B99B] bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#29231F]">{st.store_name}</h3>
                      {st.is_verified ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          VERIFIED ARTISAN
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-500 mt-0.5">
                      {st.city || 'Studio'}, {st.state || 'India'} • {st.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {st.is_verified ? (
                    <button
                      onClick={() => handleVerifySeller(st.id, false)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-600 hover:text-red-700 font-semibold transition cursor-pointer"
                    >
                      Revoke Verification
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifySeller(st.id, true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Approve & Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              User Directory & Role-Based Access Control (RBAC)
            </h2>
            <p className="text-xs text-neutral-500">
              Configure access permissions across customer, seller, management, and admin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#FAF7F2] transition">
                    <td className="py-3 font-semibold text-[#29231F]">{u.full_name || 'User'}</td>
                    <td className="py-3 text-neutral-500">{u.email}</td>
                    <td className="py-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'management'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'seller'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        className="bg-white border border-[#D9B99B]/50 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#7A4B35] cursor-pointer"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Artisan Seller</option>
                        <option value="management">Management</option>
                        <option value="admin">Platform Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
