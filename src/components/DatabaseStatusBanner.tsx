import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, ChevronRight, X, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigDetails } from '../lib/supabase';
import { apiRequest } from '../services/api';

export const DatabaseStatusBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tablesFound: boolean;
    error?: string;
    url: string;
    hasServiceRoleKey: boolean;
    hasKey: boolean;
  }>({
    configured: isSupabaseConfigured,
    connected: false,
    tablesFound: false,
    url: supabaseConfigDetails.url,
    hasServiceRoleKey: false,
    hasKey: supabaseConfigDetails.hasKey,
  });

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const res = await apiRequest('/database/status');
      if (res.success && res.data) {
        setDbStatus(res.data);
      }
    } catch (e: any) {
      setDbStatus((prev) => ({
        ...prev,
        connected: false,
        error: e.message || 'Failed to reach backend status check',
      }));
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyMigrationSql = () => {
    const sql = `-- CRAFTORA SUPABASE MIGRATION (Hardened Security Definer, Column Grants & RLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'seller', 'management', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper functions with fixed search_path (prevents hijacking & RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('management', 'admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp STABLE AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN RETURN TRUE; END IF;
  IF (auth.jwt()->>'role') = 'service_role' THEN RETURN TRUE; END IF;
  RETURN public.is_admin();
END;
$$;

-- Column-level privilege boundaries
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url, bio, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- BEFORE UPDATE Trigger Guard
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modifying profile ID is strictly forbidden.';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email AND NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'Email updates must proceed through Supabase Auth.';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin_or_service() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: only administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_privilege_guard ON public.profiles;
CREATE TRIGGER tr_profiles_privilege_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Admin role assignment RPC
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role user_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can assign user roles.';
  END IF;
  UPDATE public.profiles SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
END;
$$;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_sellers" ON public.profiles;
CREATE POLICY "profiles_select_sellers" ON public.profiles FOR SELECT USING (role = 'seller');

DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE USING (public.is_admin());

-- Automatic trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, bio, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    'customer',
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, user_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_service() FROM PUBLIC, anon, authenticated;`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      {/* Non-intrusive status pill in header or floating */}
      <div className="bg-[#29231F] text-[#FAF7F2] text-[11px] py-1 px-4 border-b border-white/10 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database size={13} className={dbStatus.connected ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="font-medium text-white/90">
              Supabase PostgreSQL:
            </span>
            {dbStatus.connected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 size={12} /> Connected & Persistent
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <AlertTriangle size={12} /> Setup Required (Keys / DNS check)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-amber-200 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{dbStatus.connected ? 'View DB Details' : 'Resolve Supabase Connection'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal with exact credentials & migration setup instructions */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#D9B99B]/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  dbStatus.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#29231F]">
                    Supabase PostgreSQL Connection
                  </h3>
                  <p className="text-xs text-[#29231F]/70">
                    Real persistent database & Supabase Auth integration status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Status Box */}
            <div className={`p-4 rounded-2xl border ${
              dbStatus.connected
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  {dbStatus.connected ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>PostgreSQL Database Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-amber-600" />
                      <span>Action Needed to Connect Database</span>
                    </>
                  )}
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={checking}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#7A4B35] hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                  <span>Recheck</span>
                </button>
              </div>

              <div className="text-xs space-y-1 font-mono text-[11px] bg-white/70 p-2.5 rounded-xl border border-black/5">
                <div>Project URL: <strong>{dbStatus.url || 'https://grixqtjyajwrnrahkbyp.supabase.co'}</strong></div>
                <div>VITE_SUPABASE_ANON_KEY: {dbStatus.hasKey ? 'Configured' : 'Missing (Required for Browser Auth)'}</div>
                <div>SUPABASE_SERVICE_ROLE_KEY: {dbStatus.hasServiceRoleKey ? 'Configured' : 'Missing (Required for Server Admin)'}</div>
                {dbStatus.error && (
                  <div className="text-rose-700 font-sans text-xs pt-1 font-medium">
                    Diagnostic: {dbStatus.error}
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Steps */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-[#29231F]">
                How to Connect Your Real Supabase Project:
              </h4>

              <div className="space-y-3 text-xs text-[#29231F]/80">
                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#7A4B35] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-[#29231F]">Verify Your Supabase Project Host</p>
                    <p className="text-[11px] text-[#29231F]/70">
                      Ensure your Supabase project at <code className="bg-neutral-100 px-1 py-0.5 rounded">https://grixqtjyajwrnrahkbyp.supabase.co</code> is active and not paused or misspelled in the project dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#7A4B35] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-[#29231F]">Copy Your API Keys from Supabase Dashboard</p>
                    <p className="text-[11px] text-[#29231F]/70">
                      In Supabase Dashboard, open <strong>Project Settings → API</strong>.
                      Copy the <code className="bg-neutral-100 px-1 py-0.5 rounded">anon public</code> key and <code className="bg-neutral-100 px-1 py-0.5 rounded">service_role secret</code> key.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#7A4B35] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-[#29231F]">Set the Variables in AI Studio Settings</p>
                    <p className="text-[11px] text-[#29231F]/70">
                      Add <code className="bg-neutral-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> and <code className="bg-neutral-100 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in the Settings menu.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#7A4B35] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-[#29231F]">Execute PostgreSQL Migration in Supabase</p>
                    <p className="text-[11px] text-[#29231F]/70">
                      Open Supabase <strong>SQL Editor</strong>, create a New query, and paste the schema script.
                    </p>
                  </div>
                </div>
              </div>

              {/* Copy SQL Button */}
              <div className="pt-2">
                <button
                  onClick={copyMigrationSql}
                  className="w-full py-2.5 px-4 bg-[#7A4B35] hover:bg-[#633B29] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                  <span>{copied ? 'SQL Migration Copied to Clipboard!' : 'Copy Schema Migration SQL'}</span>
                </button>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#29231F] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
