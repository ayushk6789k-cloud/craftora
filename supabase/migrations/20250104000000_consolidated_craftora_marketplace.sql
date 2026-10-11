-- ==============================================================================
-- CRAFTORA MARKETPLACE - CONSOLIDATED PRODUCTION POSTGRESQL & SUPABASE MIGRATION
-- File: supabase/migrations/20250104000000_consolidated_craftora_marketplace.sql
-- Description:
--   Single-run, non-destructive, hardened PostgreSQL migration for Supabase.
--   Encompasses:
--     1. Extensions & Normalized Enums
--     2. Hardened public.profiles linked 1:1 with auth.users (UUID PK)
--     3. Column-level UPDATE grants preventing role or identifier tampering
--     4. Tamper-proof BEFORE UPDATE trigger enforcing privilege boundaries
--     5. SECURITY DEFINER helpers with fixed search_path = public, pg_temp
--     6. All 21 normalized marketplace tables with check constraints & indexes
--     7. Comprehensive Row Level Security (RLS) policies on ALL 21 tables
--     8. Sanitized automatic trigger on auth.users defaulting strictly to customer
--     9. Strict execution grants revoking PUBLIC access
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ENUMS (Idempotent creation)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('customer', 'seller', 'management', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seller_app_status') THEN
    CREATE TYPE public.seller_app_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE public.product_status AS ENUM ('draft', 'pending_approval', 'active', 'rejected', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refund_pending', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE public.payment_method_type AS ENUM ('razorpay', 'cod', 'demo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type') THEN
    CREATE TYPE public.inventory_movement_type AS ENUM ('initial_stock', 'order_reservation', 'reservation_released', 'order_fulfilled', 'manual_adjustment', 'return_restock');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed_amount');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE (Linked 1:1 with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'customer',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER HELPER FUNCTIONS (Strict search_path prevents hijacking)
-- ------------------------------------------------------------------------------

-- Non-recursive admin check
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

-- Non-recursive staff check (management or admin)
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

-- Admin or Service Role verification
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

-- ------------------------------------------------------------------------------
-- 5. MULTI-LAYER PRIVILEGE ESCALATION PREVENTION
-- ------------------------------------------------------------------------------

-- A. Column-Level Permissions (Engine-level enforcement)
REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name, phone, avatar_url, bio, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- B. Tamper-Proof Trigger Guard
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := NOW();

  -- Prevent primary key mutation
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modifying profile identifier is strictly forbidden.';
  END IF;

  -- Prevent direct email alteration
  IF NEW.email IS DISTINCT FROM OLD.email AND NOT public.is_admin_or_service() THEN
    RAISE EXCEPTION 'Email updates must proceed through verified Supabase Auth procedures.';
  END IF;

  -- Prevent role modification unless admin or service_role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin_or_service() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: only authorized administrators can modify user roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_privilege_guard ON public.profiles;
CREATE TRIGGER tr_profiles_privilege_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- C. Secure RPC for Administrators to assign user roles
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role public.user_role
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

-- ------------------------------------------------------------------------------
-- 6. ALL 21 MARKETPLACE TABLES & CONSTRAINTS
-- ------------------------------------------------------------------------------

-- 6.1 SELLER APPLICATIONS
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name VARCHAR(150) NOT NULL,
    craft_type VARCHAR(100) NOT NULL,
    department VARCHAR(50) DEFAULT 'FD',
    bio TEXT NOT NULL,
    experience_years INT DEFAULT 1,
    id_proof_url TEXT,
    sample_work_urls TEXT[],
    status public.seller_app_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.2 SELLER STORES
CREATE TABLE IF NOT EXISTS public.seller_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
    store_name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(180) NOT NULL UNIQUE,
    tagline VARCHAR(255),
    story TEXT,
    logo_url TEXT,
    banner_url TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    instagram_handle VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    commission_rate_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.3 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.4 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_stores(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    sku VARCHAR(64) NOT NULL UNIQUE,
    short_description VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    base_price INT NOT NULL CHECK (base_price >= 0),
    selling_price INT NOT NULL CHECK (selling_price >= 0 AND selling_price <= base_price),
    cost_price INT NOT NULL CHECK (cost_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    material VARCHAR(150),
    color VARCHAR(100),
    dimensions VARCHAR(100),
    weight_grams INT CHECK (weight_grams >= 0),
    care_instructions TEXT,
    handmade_technique VARCHAR(150),
    customization_available BOOLEAN NOT NULL DEFAULT FALSE,
    processing_time_days INT NOT NULL DEFAULT 2 CHECK (processing_time_days >= 1),
    status public.product_status NOT NULL DEFAULT 'pending_approval',
    rejection_reason TEXT,
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.5 PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.6 PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    sku VARCHAR(64) UNIQUE,
    additional_price INT NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.7 INVENTORY RESERVATIONS
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    order_reference VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_released BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.8 INVENTORY MOVEMENTS (Auditable Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_change INT NOT NULL,
    movement_type public.inventory_movement_type NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.9 ADDRESSES (Customer shipping/billing addresses)
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(12) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.10 CARTS
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.11 CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 6.12 WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 6.13 COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    discount_type public.discount_type NOT NULL,
    discount_value INT NOT NULL CHECK (discount_value > 0),
    min_order_value INT NOT NULL DEFAULT 0,
    max_discount_amount INT,
    usage_limit INT,
    times_used INT NOT NULL DEFAULT 0,
    per_customer_limit INT NOT NULL DEFAULT 1,
    start_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.14 MARKETING CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL,
    budget INT NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_category_id UUID REFERENCES public.categories(id),
    coupon_id UUID REFERENCES public.coupons(id),
    status public.campaign_status NOT NULL DEFAULT 'draft',
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.15 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    subtotal_amount INT NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount INT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee INT NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    tax_amount INT NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount INT NOT NULL CHECK (total_amount >= 0),
    applied_coupon_code VARCHAR(32),
    order_status public.order_status NOT NULL DEFAULT 'confirmed',
    payment_status public.payment_status NOT NULL DEFAULT 'paid',
    payment_method public.payment_method_type NOT NULL DEFAULT 'demo',
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.16 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price INT NOT NULL CHECK (unit_price >= 0),
    total_price INT NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.17 SELLER ORDERS (Sub-orders partitioned per artisan store)
CREATE TABLE IF NOT EXISTS public.seller_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.seller_stores(id) ON DELETE RESTRICT,
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    commission_amount INT NOT NULL DEFAULT 0,
    payout_amount INT NOT NULL CHECK (payout_amount >= 0),
    status public.order_status NOT NULL DEFAULT 'confirmed',
    tracking_number VARCHAR(100),
    courier_partner VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.18 PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status public.payment_status NOT NULL DEFAULT 'paid',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'demo',
    gateway_reference VARCHAR(150),
    gateway_signature VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.19 REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(150),
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- 6.20 AUDIT LOGS (Immutable tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE & LOOKUP INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller ON public.seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- ------------------------------------------------------------------------------
-- 8. COMPREHENSIVE ROW LEVEL SECURITY (RLS) ON ALL 21 TABLES
-- ------------------------------------------------------------------------------

-- 1. PROFILES
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

-- 2. SELLER APPLICATIONS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_apps_select" ON public.seller_applications;
CREATE POLICY "seller_apps_select" ON public.seller_applications FOR SELECT 
  USING (auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "seller_apps_insert" ON public.seller_applications;
CREATE POLICY "seller_apps_insert" ON public.seller_applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "seller_apps_update" ON public.seller_applications;
CREATE POLICY "seller_apps_update" ON public.seller_applications FOR UPDATE 
  USING (public.is_staff());

-- 3. SELLER STORES
ALTER TABLE public.seller_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_stores_select_public" ON public.seller_stores;
CREATE POLICY "seller_stores_select_public" ON public.seller_stores FOR SELECT 
  USING (is_active = true OR user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "seller_stores_manage_own" ON public.seller_stores;
CREATE POLICY "seller_stores_manage_own" ON public.seller_stores FOR ALL 
  USING (user_id = auth.uid() OR public.is_staff());

-- 4. CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT 
  USING (is_active = true OR public.is_staff());

DROP POLICY IF EXISTS "categories_manage_staff" ON public.categories;
CREATE POLICY "categories_manage_staff" ON public.categories FOR ALL 
  USING (public.is_staff());

-- 5. PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active" ON public.products FOR SELECT 
  USING (status = 'active' OR seller_id IN (SELECT id FROM public.seller_stores WHERE user_id = auth.uid()) OR public.is_staff());

DROP POLICY IF EXISTS "products_seller_manage" ON public.products;
CREATE POLICY "products_seller_manage" ON public.products FOR ALL 
  USING (seller_id IN (SELECT id FROM public.seller_stores WHERE user_id = auth.uid()) OR public.is_staff());

-- 6. PRODUCT IMAGES
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_images_select_public" ON public.product_images;
CREATE POLICY "product_images_select_public" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_images_manage" ON public.product_images;
CREATE POLICY "product_images_manage" ON public.product_images FOR ALL 
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_stores s ON s.id = p.seller_id
      WHERE s.user_id = auth.uid()
    ) OR public.is_staff()
  );

-- 7. PRODUCT VARIANTS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_variants_select_public" ON public.product_variants;
CREATE POLICY "product_variants_select_public" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_variants_manage" ON public.product_variants;
CREATE POLICY "product_variants_manage" ON public.product_variants FOR ALL 
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_stores s ON s.id = p.seller_id
      WHERE s.user_id = auth.uid()
    ) OR public.is_staff()
  );

-- 8. INVENTORY RESERVATIONS
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_reservations_select" ON public.inventory_reservations;
CREATE POLICY "inventory_reservations_select" ON public.inventory_reservations FOR SELECT 
  USING (
    public.is_staff() OR product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_stores s ON s.id = p.seller_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "inventory_reservations_manage" ON public.inventory_reservations;
CREATE POLICY "inventory_reservations_manage" ON public.inventory_reservations FOR ALL 
  USING (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- 9. INVENTORY MOVEMENTS (Ledger)
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT 
  USING (
    public.is_staff() OR product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_stores s ON s.id = p.seller_id
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_insert" ON public.inventory_movements FOR INSERT 
  WITH CHECK (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- 10. ADDRESSES (Customer address privacy)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addresses_user_manage" ON public.addresses;
CREATE POLICY "addresses_user_manage" ON public.addresses FOR ALL 
  USING (auth.uid() = user_id OR public.is_staff())
  WITH CHECK (auth.uid() = user_id);

-- 11. CARTS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "carts_user_manage" ON public.carts;
CREATE POLICY "carts_user_manage" ON public.carts FOR ALL 
  USING (auth.uid() = user_id OR public.is_staff())
  WITH CHECK (auth.uid() = user_id);

-- 12. CART ITEMS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart_items_user_manage" ON public.cart_items;
CREATE POLICY "cart_items_user_manage" ON public.cart_items FOR ALL 
  USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()) OR public.is_staff())
  WITH CHECK (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()) OR public.is_staff());

-- 13. WISHLISTS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlists_user_manage" ON public.wishlists;
CREATE POLICY "wishlists_user_manage" ON public.wishlists FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 14. COUPONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
CREATE POLICY "coupons_select_active" ON public.coupons FOR SELECT 
  USING (is_active = true OR public.is_staff());

DROP POLICY IF EXISTS "coupons_manage_staff" ON public.coupons;
CREATE POLICY "coupons_manage_staff" ON public.coupons FOR ALL 
  USING (public.is_staff());

-- 15. MARKETING CAMPAIGNS (Internal only)
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_staff_only" ON public.marketing_campaigns;
CREATE POLICY "campaigns_staff_only" ON public.marketing_campaigns FOR ALL 
  USING (public.is_staff());

-- 16. ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.is_staff() 
    OR id IN (
      SELECT order_id FROM public.seller_orders 
      WHERE seller_id IN (SELECT id FROM public.seller_stores WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_staff());

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE 
  USING (public.is_staff());

-- 17. ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT 
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    OR product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_stores s ON s.id = p.seller_id
      WHERE s.user_id = auth.uid()
    )
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "order_items_manage" ON public.order_items;
CREATE POLICY "order_items_manage" ON public.order_items FOR ALL 
  USING (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- 18. SELLER ORDERS
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seller_orders_select" ON public.seller_orders;
CREATE POLICY "seller_orders_select" ON public.seller_orders FOR SELECT 
  USING (seller_id IN (SELECT id FROM public.seller_stores WHERE user_id = auth.uid()) OR public.is_staff());

DROP POLICY IF EXISTS "seller_orders_update" ON public.seller_orders;
CREATE POLICY "seller_orders_update" ON public.seller_orders FOR UPDATE 
  USING (seller_id IN (SELECT id FROM public.seller_stores WHERE user_id = auth.uid()) OR public.is_staff());

DROP POLICY IF EXISTS "seller_orders_insert_staff" ON public.seller_orders;
CREATE POLICY "seller_orders_insert_staff" ON public.seller_orders FOR INSERT 
  WITH CHECK (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- 19. PAYMENTS (Confidential financial records)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT 
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()) OR public.is_staff());
DROP POLICY IF EXISTS "payments_manage" ON public.payments;
CREATE POLICY "payments_manage" ON public.payments FOR ALL 
  USING (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- 20. REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select_approved" ON public.reviews;
CREATE POLICY "reviews_select_approved" ON public.reviews FOR SELECT 
  USING (is_approved = true OR auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE 
  USING (auth.uid() = user_id OR public.is_staff());

-- 21. AUDIT LOGS (Immutable tracking)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT 
  USING (public.is_staff());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT 
  WITH CHECK (public.is_staff() OR current_user IN ('service_role', 'postgres'));

-- ------------------------------------------------------------------------------
-- 9. SANITIZED AUTOMATIC SIGNUP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw_account_type TEXT;
  v_full_name TEXT;
  v_store_name TEXT;
  v_craft_type TEXT;
  v_bio TEXT;
  v_phone TEXT;
BEGIN
  -- 1. Sanitize full_name: truncate to 150 chars, fallback to email prefix if empty
  v_full_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  IF v_full_name = '' THEN
    v_full_name := split_part(NEW.email, '@', 1);
  END IF;
  v_full_name := SUBSTRING(v_full_name FROM 1 FOR 150);

  -- 2. Sanitize phone: max 30 chars
  v_phone := SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')) FROM 1 FOR 30);
  IF v_phone = '' THEN
    v_phone := NULL;
  END IF;

  -- 3. Sanitize bio
  v_bio := SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data->>'bio', '')) FROM 1 FOR 1000);

  -- 4. Insert into public.profiles
  -- CRITICAL SECURITY: Role is strictly hardcoded to 'customer'::public.user_role.
  -- Client-provided metadata keys such as 'role', 'claims', or 'is_admin' are completely discarded.
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
    v_phone,
    'customer'::public.user_role,
    v_bio,
    SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')) FROM 1 FOR 500),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- 5. Safe Seller Application intake
  -- Only queues a pending application if the registrant specified interest in an artisan account
  v_raw_account_type := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer')));
  IF v_raw_account_type = 'seller' THEN
    v_store_name := SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data->>'store_name', v_full_name || '''s Studio')) FROM 1 FOR 150);
    v_craft_type := SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data->>'craft_type', 'Handcrafted Accessories')) FROM 1 FOR 100);

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
      'pending'::public.seller_app_status,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 10. STRICT FUNCTION EXECUTION PERMISSIONS
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_or_service() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, public.user_role) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.user_role) TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ------------------------------------------------------------------------------
-- 11. DEFAULT ESSENTIAL MARKETPLACE CATEGORIES
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, image_url, display_order, is_active)
VALUES
('Handmade Jewelry', 'handmade-jewelry', 'Artisanal necklaces, earrings, and rings meticulously crafted by hand.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', 1, true),
('Handcrafted Bags', 'handcrafted-bags', 'Sustainably woven macrame, canvas, and crochet bags with organic textures.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', 2, true),
('Hair Accessories', 'hair-accessories', 'Embroidered hairbands, silk scrunchies, and hand-carved wooden clips.', 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=600&auto=format&fit=crop&q=80', 3, true),
('Textile & Scarves', 'textile-accessories', 'Hand block-printed stoles, handwoven shawls, and bandhani neckerchiefs.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80', 4, true),
('Eco-Friendly & Resin', 'eco-friendly-accessories', 'Botanical resin keychains, terracotta charms, and recycled paper accessories.', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=80', 5, true),
('Traditional Crafts', 'traditional-accessories', 'Heritage brass filigree, meenakari work, and terracotta jewelry.', 'https://images.unsplash.com/photo-1611591475155-426c04a29c01?w=600&auto=format&fit=crop&q=80', 6, true)
ON CONFLICT (slug) DO NOTHING;
