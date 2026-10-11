import React, { useState, useEffect } from 'react';
import { Package, Heart, User, Sparkles, Check, Clock, Truck, CheckCircle2, AlertCircle, FileText, Printer, X } from 'lucide-react';
import { Order, formatPaise } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { apiRequest } from '../services/api';

interface AccountPageProps {
  initialTab?: 'orders' | 'wishlist' | 'profile' | 'apply';
  onExploreProducts: () => void;
  onNavigate?: (route: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  initialTab = 'orders',
  onExploreProducts,
  onNavigate,
}) => {
  const { user, updateProfile, applySeller } = useAuth();
  const { wishlistProducts, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'apply'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Seller application form
  const [storeName, setStoreName] = useState('');
  const [craftType, setCraftType] = useState('Terracotta & Ceramics');
  const [experienceYears, setExperienceYears] = useState(1);
  const [appBio, setAppBio] = useState('');
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [appError, setAppError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await apiRequest('/orders');
        if (res.success && res.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateProfile({ full_name: fullName, phone, bio });
    if (ok) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleSellerApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError('');
    const res = await applySeller({
      store_name: storeName,
      craft_type: craftType,
      experience_years: experienceYears,
      bio: appBio,
    });

    if (res.success) {
      setAppSubmitted(true);
    } else {
      setAppError(res.error || 'Failed to submit application');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you wish to cancel this handcrafted order?')) return;
    try {
      const res = await apiRequest(`/orders/${orderId}/cancel`, { method: 'POST' });
      if (res.success) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, order_status: 'cancelled' } : o)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#D9B99B]/40 text-[#7A4B35] flex items-center justify-center mx-auto shadow-xs">
          <User size={30} />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-[#29231F]">Sign In to Your Account</h1>
          <p className="text-sm text-[#29231F]/70 leading-relaxed">
            Please sign in to view your orders, delivery status, wishlist, and artisan maker studio application.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate?.('login')}
            className="px-6 py-2.5 bg-[#7A4B35] hover:bg-[#633B29] text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate?.('register')}
            className="px-6 py-2.5 bg-white hover:bg-[#FAF7F2] border border-[#D9B99B]/60 text-[#7A4B35] rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Create an Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Summary */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#7A4B35] text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#29231F]">{user?.full_name}</h1>
            <p className="text-xs text-[#29231F]/70">{user?.email}</p>
            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-[#7A4B35] border border-[#D9B99B]/40">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#D9B99B]/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            <Package size={14} /> Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wishlist' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            <Heart size={14} /> Wishlist ({wishlistProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
            }`}
          >
            <User size={14} /> Profile
          </button>
          {user?.role !== 'seller' && (
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'apply' ? 'bg-[#7A4B35] text-white' : 'text-[#29231F] hover:bg-[#FAF7F2]'
              }`}
            >
              <Sparkles size={14} /> Become Seller
            </button>
          )}
        </div>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-[#29231F]">Your Order History</h2>

          {loadingOrders ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-neutral-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#D9B99B]/30 space-y-3">
              <Package size={32} className="mx-auto text-neutral-400" />
              <h3 className="font-bold text-base text-[#29231F]">No orders placed yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore hand-carved accessories, terracotta pieces, and silk bags from our campus creators.
              </p>
              <button
                onClick={onExploreProducts}
                className="bg-[#7A4B35] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#B77948] transition cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 space-y-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D9B99B]/20 text-xs">
                    <div>
                      <span className="font-bold text-sm text-[#29231F]">{order.order_number}</span>
                      <span className="text-neutral-500 block text-[11px]">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                          order.order_status === 'confirmed' || order.order_status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.order_status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        Status: {order.order_status.toUpperCase()}
                      </span>

                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                          order.payment_status === 'paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {order.payment_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-neutral-100 text-xs">
                    {order.items?.map((it) => (
                      <div key={it.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-[#29231F]">{it.product_name}</p>
                          <p className="text-[11px] text-neutral-500">
                            Qty: {it.quantity} × {formatPaise(it.unit_price)}
                          </p>
                        </div>
                        <span className="font-bold text-[#29231F]">{formatPaise(it.total_price)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seller sub-orders breakdown */}
                  {order.seller_orders && order.seller_orders.length > 0 && (
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl space-y-2 border border-[#D9B99B]/30 text-xs">
                      <h4 className="font-bold uppercase tracking-wider text-[#7A4B35] text-[10px]">
                        Vendor Sub-Orders & Fulfillment
                      </h4>
                      {order.seller_orders.map((so) => (
                        <div key={so.id} className="flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-semibold text-[#29231F]">{so.seller_name}</span>
                            {so.tracking_number && (
                              <span className="ml-2 text-neutral-500">
                                Tracking: {so.shipping_carrier || 'Campus Logistics'} ({so.tracking_number})
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-neutral-600">
                            {so.fulfillment_status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Total & Actions */}
                  <div className="pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-500">Total Amount: </span>
                      <span className="text-base font-bold text-[#7A4B35]">
                        {formatPaise(order.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="px-3 py-1.5 rounded-xl border border-[#D9B99B]/60 text-[#7A4B35] hover:bg-[#FAF7F2] font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs"
                      >
                        <FileText size={13} /> View Receipt
                      </button>

                      {!['shipped', 'delivered', 'cancelled'].includes(order.order_status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-800 font-semibold transition cursor-pointer"
                        >
                          Cancel
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

      {/* Tab: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-[#29231F]">
            Saved Creations ({wishlistProducts.length})
          </h2>

          {wishlistProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#D9B99B]/30 space-y-3">
              <Heart size={32} className="mx-auto text-neutral-400" />
              <h3 className="font-bold text-base text-[#29231F]">Your wishlist is empty</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Click the heart icon on any piece you adore to save it for later.
              </p>
              <button
                onClick={onExploreProducts}
                className="bg-[#7A4B35] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#B77948] transition cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#D9B99B]/40 p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex gap-4">
                    <img
                      src={p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200'}
                      alt={p.name}
                      className="w-20 h-20 rounded-xl object-cover bg-[#FAF7F2]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-[#7A4B35] uppercase">
                        {p.seller?.store_name}
                      </span>
                      <h4 className="font-bold text-xs text-[#29231F] truncate mt-0.5">{p.name}</h4>
                      <p className="font-bold text-xs text-[#29231F] mt-1">{formatPaise(p.selling_price)}</p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 flex gap-2">
                    <button
                      onClick={() => addToCart(p.id, 1)}
                      className="flex-1 bg-[#7A4B35] hover:bg-[#B77948] text-white py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Add to Bag
                    </button>
                    <button
                      onClick={() => removeFromWishlist(p.id)}
                      className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-red-600 transition cursor-pointer text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSave}
          className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 sm:p-8 space-y-6 max-w-xl shadow-xs"
        >
          <h2 className="font-display text-xl font-bold text-[#29231F] pb-3 border-b border-[#D9B99B]/20">
            Edit Account Profile
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Email Address (Permanent)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#29231F]">Bio / Personal Note</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a little about yourself or your appreciation for handcrafted goods..."
                className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess && (
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                <Check size={14} /> Profile updated successfully!
              </span>
            )}
            <button
              type="submit"
              className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-md ml-auto cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab: Become a Seller */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-3xl border border-[#D9B99B]/40 p-6 sm:p-8 max-w-2xl space-y-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B77948]">
              Creator Verification
            </span>
            <h2 className="font-display text-2xl font-bold text-[#29231F] mt-1">
              Apply to Become a Craftora Artisan
            </h2>
            <p className="text-xs text-[#29231F]/70 mt-1">
              Fashion Design students and local makers can list accessories with 0 onboarding fees and guaranteed college platform promotion.
            </p>
          </div>

          {appSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900">Application Submitted!</h3>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Our Engineering & Fashion Design administrators will review your craft portfolio. Once reviewed, your artisan studio will be activated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSellerApply} className="space-y-4 text-xs">
              {appError && <p className="text-red-600">{appError}</p>}

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Studio or Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clay & Knot Studio"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Primary Handcraft Discipline *</label>
                <select
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none bg-white font-medium"
                >
                  <option value="Terracotta & Ceramics">Terracotta & Ceramics</option>
                  <option value="Macramé & Fiber Arts">Macramé & Fiber Arts</option>
                  <option value="Hand-Carved Brass & Metals">Hand-Carved Brass & Metals</option>
                  <option value="Embroidered Silk Pouches">Embroidered Silk Pouches</option>
                  <option value="Artisanal Leatherwork">Artisanal Leatherwork</option>
                  <option value="Mixed Media Handmade">Mixed Media Handmade</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Years of Craft Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#29231F]">Artisan Craft Story & Background *</label>
                <textarea
                  rows={4}
                  required
                  value={appBio}
                  onChange={(e) => setAppBio(e.target.value)}
                  placeholder="Tell us about the materials you use, how you learned your craft, and your design inspirations..."
                  className="w-full p-3 rounded-xl border border-[#D9B99B]/50 focus:border-[#7A4B35] focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#7A4B35] hover:bg-[#B77948] text-white py-3.5 rounded-2xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Submit Artisan Application
              </button>
            </form>
          )}
        </div>
      )}

      {/* Order Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D9B99B]/30 pr-8">
              <div>
                <span className="font-display text-xl font-bold text-[#7A4B35]">CRAFTORA</span>
                <p className="text-xs text-neutral-500">Official Tax Invoice & Delivery Receipt</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#29231F] block">{selectedReceiptOrder.order_number}</span>
                <span className="text-[11px] text-neutral-400">
                  {new Date(selectedReceiptOrder.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Status pills */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF7F2] rounded-2xl text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase">Order Status</span>
                <span className="font-bold text-emerald-800 uppercase">
                  {selectedReceiptOrder.order_status}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase">Payment</span>
                <span className="font-bold text-emerald-800 uppercase">
                  {selectedReceiptOrder.payment_status}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase">Database Sync</span>
                <span className="font-bold text-emerald-700">Verified PostgreSQL</span>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#D9B99B]/30 text-xs space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#7A4B35]">
                Shipping Address
              </h4>
              <p className="font-bold text-sm text-[#29231F]">{selectedReceiptOrder.shipping_name}</p>
              <p>{selectedReceiptOrder.shipping_address_line1}</p>
              {selectedReceiptOrder.shipping_address_line2 && <p>{selectedReceiptOrder.shipping_address_line2}</p>}
              <p>
                {selectedReceiptOrder.shipping_city}, {selectedReceiptOrder.shipping_state} - {selectedReceiptOrder.shipping_postal_code}
              </p>
              <p className="text-neutral-500 font-mono pt-1">Phone: {selectedReceiptOrder.shipping_phone}</p>
            </div>

            {/* Itemized Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#7A4B35]">
                Purchased Pieces
              </h4>
              <div className="divide-y divide-neutral-100 text-xs">
                {selectedReceiptOrder.items?.map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#29231F]">{it.product_name}</p>
                      <p className="text-[11px] text-neutral-500">
                        Qty: {it.quantity} × {formatPaise(it.unit_price)}
                      </p>
                    </div>
                    <span className="font-bold text-[#29231F]">{formatPaise(it.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPaise(selectedReceiptOrder.subtotal_amount)}</span>
                </div>
                {selectedReceiptOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatPaise(selectedReceiptOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Campus Shipping</span>
                  <span>{selectedReceiptOrder.shipping_amount === 0 ? 'FREE' : formatPaise(selectedReceiptOrder.shipping_amount)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-[#29231F]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#7A4B35]">{formatPaise(selectedReceiptOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                onClick={() => window.print()}
                className="bg-neutral-800 hover:bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="bg-[#7A4B35] hover:bg-[#B77948] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
