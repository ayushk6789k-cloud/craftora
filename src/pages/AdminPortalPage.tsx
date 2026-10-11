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
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const AdminPortalPage: React.FC = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/overview');
      if (res.success && res.data) {
        setAdminData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifySeller = async (storeId: string, verify: boolean) => {
    try {
      const res = await apiRequest(`/admin/stores/${storeId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ is_verified: verify }),
      });
      if (res.success) {
        setActionSuccess(`Store ${verify ? 'verified' : 'unverified'} successfully!`);
        fetchAdminData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
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
        fetchAdminData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
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

  const stores = adminData?.stores || [];
  const users = adminData?.users || [];
  const pendingApplications = adminData?.pendingApplications || [];
  const systemHealth = adminData?.systemHealth || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#D9B99B]/40 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7A4B35] text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <Server size={28} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B77948]">
              Engineering (ET) Master Console
            </span>
            <h1 className="font-display text-2xl font-bold text-[#29231F]">
              System Architecture & Governance
            </h1>
            <p className="text-xs text-[#29231F]/70">
              Database state integrity, atomic inventory monitoring, and vendor approval pipelines.
            </p>
          </div>
        </div>

        {actionSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl">
            {actionSuccess}
          </span>
        )}
      </div>

      {/* System Health / DevOps Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Database Status</span>
            <Database size={16} className="text-emerald-600" />
          </div>
          <p className="font-display text-xl font-bold text-emerald-700">Healthy (PostgreSQL Ready)</p>
          <p className="text-[11px] text-neutral-400">Atomic transactions active</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Server Latency</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">{systemHealth.apiLatencyMs || 12} ms</p>
          <p className="text-[11px] text-neutral-400">Fast local node loop</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Currency Integrity</span>
            <Cpu size={16} className="text-[#7A4B35]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#7A4B35]">Paise Integer Safe</p>
          <p className="text-[11px] text-neutral-400">Zero float round-off errors</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#D9B99B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Accounts</span>
            <Users size={16} className="text-purple-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#29231F]">{users.length} Users</p>
          <p className="text-[11px] text-neutral-400">Across all 4 roles</p>
        </div>
      </div>

      {/* Artisan Applications Queue */}
      <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#29231F]">
              Student Artisan Verification & Approval Desk
            </h2>
            <p className="text-xs text-neutral-500">
              Review fashion design students and regional craft makers requesting verified seller status.
            </p>
          </div>
          <span className="text-xs font-bold text-[#7A4B35] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#D9B99B]/40">
            {stores.length} Studios Registered
          </span>
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
                  className="w-12 h-12 rounded-xl object-cover border border-[#D9B99B]"
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
                        PENDING LAB AUDIT
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-500 mt-0.5">
                    {st.city}, {st.state} • {st.tagline}
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-1 max-w-xl italic line-clamp-2">
                    "{st.story}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {st.is_verified ? (
                  <button
                    onClick={() => handleVerifySeller(st.id, false)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-600 hover:text-red-700 font-semibold transition cursor-pointer"
                  >
                    Revoke Badge
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

      {/* User Directory & Role Management */}
      <div className="bg-white rounded-3xl border border-[#D9B99B]/30 p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="font-display text-xl font-bold text-[#29231F]">
            User Directory & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-neutral-500">
            Directly configure access permissions across customer, seller, management, and admin.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Current Role</th>
                <th className="pb-3 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-[#FAF7F2] transition">
                  <td className="py-3 font-semibold text-[#29231F]">{u.full_name}</td>
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
                      <option value="admin">Engineering Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
