-- ==============================================================================
-- CRAFTORA MARKETPLACE - HARDENED SUPABASE AUTH & PROFILES MIGRATION
-- Migration: 20250102000000_supabase_auth_and_profiles.sql
-- Description:
--   1. Creates user_role enum ('customer', 'seller', 'management', 'admin')
--   2. Creates public.profiles linked directly to auth.users (UUID PK)
--   3. Strictly defaults all new users to 'customer' role
--   4. Column-level UPDATE grants preventing ordinary users from touching role or id
--   5. Hardened BEFORE UPDATE trigger enforcing privilege boundaries
--   6. SECURE SECURITY DEFINER functions with fixed search_path = public, pg_temp
--   7. Recursion-free RLS policies for reading and updating profiles
--   8. Automatic trigger on auth.users to create profile records
-- ==============================================================================

-- 1. Create Role Enum if not already created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'seller', 'management', 'admin');
  END IF;
END $$;

-- 2. Create Profiles Table linked to auth.users
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

-- 3. Security Definer Helper Functions (with explicit search_path preventing injection & recursion)

-- Check if current authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if current authenticated user is staff (management or admin)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('management', 'admin')
  );
$$;

-- Internal helper: check if context is service_role or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN TRUE;
  END IF;
  IF (auth.jwt()->>'role') = 'service_role' THEN
    RETURN TRUE;
  END IF;
  RETURN public.is_admin();
END;
$$;

-- 4. Multi-Layer Privilege Escalation Prevention

-- A. Column-Level Permissions (First line of defense)
-- Revoke all UPDATE privileges on the table
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;

-- Authenticated users can ONLY update non-privileged profile columns
GRANT UPDATE (full_name, phone, avatar_url, bio, updated_at) ON public.profiles TO authenticated;

-- Service role and table owner retain administrative rights
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- B. Hardened BEFORE UPDATE Trigger (Second line of defense)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Automatically timestamp updates
  NEW.updated_at := NOW();

  -- Disallow mutating profile primary key
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modifying profile ID is strictly forbidden.';
  END IF;

  -- Disallow ordinary users from mutating email directly (must go through Supabase Auth flow)
  IF NEW.email IS DISTINCT FROM OLD.email AND NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'Email address must be updated through authenticated Supabase Auth procedures.';
  END IF;

  -- Disallow mutating role unless the caller is verified administrator or service_role
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

-- C. Secure RPC for Administrators to update roles safely
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role user_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can assign user roles.';
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile with ID % not found.', target_user_id;
  END IF;
END;
$$;

-- 5. Enable Row Level Security (RLS) & Non-Recursive Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT Policies:
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_sellers" ON public.profiles;
CREATE POLICY "profiles_select_sellers"
  ON public.profiles FOR SELECT
  USING (role = 'seller');

DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff"
  ON public.profiles FOR SELECT
  USING (public.is_staff());

-- UPDATE Policies (Users update own row; Admins update any row)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- DELETE Policies (Admins only)
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- 6. Trigger Function: Automatically populate public.profiles on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_type TEXT;
  v_full_name TEXT;
  v_store_name TEXT;
  v_craft_type TEXT;
  v_bio TEXT;
BEGIN
  v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_store_name := COALESCE(NEW.raw_user_meta_data->>'store_name', v_full_name || '''s Studio');
  v_craft_type := COALESCE(NEW.raw_user_meta_data->>'craft_type', 'Handcrafted Accessories');
  v_bio := COALESCE(NEW.raw_user_meta_data->>'bio', '');

  -- Insert profile with customer role strictly defaulted
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    bio,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    NEW.raw_user_meta_data->>'phone',
    'customer', -- Strictly customer role
    v_bio,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- If registered as Artisan, create pending seller application if table exists
  IF v_account_type = 'seller' THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'seller_applications'
    ) THEN
      INSERT INTO public.seller_applications (
        user_id,
        store_name,
        craft_type,
        department,
        bio,
        status,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        v_store_name,
        v_craft_type,
        'FD',
        v_bio,
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant Execution Permissions on Helper Functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, user_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_service() FROM PUBLIC, anon, authenticated;
