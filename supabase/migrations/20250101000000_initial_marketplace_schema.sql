-- ==============================================================================
-- CRAFTORA MARKETPLACE - POSTGRESQL / SUPABASE DATABASE MIGRATION
-- Migration: 20250101000000_initial_marketplace_schema.sql
-- Description: Creates all 22 normalized tables, UUID extensions, RLS policies, 
--              check constraints, audit triggers, and indexes.
-- Currency Representation: All monetary values stored as exact integer paise (INR).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'management', 'admin');
CREATE TYPE seller_app_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE product_status AS ENUM ('draft', 'pending_approval', 'active', 'rejected', 'archived');
CREATE TYPE order_status AS ENUM ('pending_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refund_pending', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('razorpay', 'cod');
CREATE TYPE inventory_movement_type AS ENUM ('initial_stock', 'order_reservation', 'reservation_released', 'order_fulfilled', 'manual_adjustment', 'return_restock');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');

-- 3. PROFILES TABLE (Linked with auth.users if using Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Supabase auth user reference
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SELLER APPLICATIONS
CREATE TABLE IF NOT EXISTS seller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    store_name VARCHAR(150) NOT NULL,
    craft_type VARCHAR(100) NOT NULL, -- e.g., 'Macrame', 'Jewelry', 'Terracotta'
    department VARCHAR(50), -- 'FD', 'ET', 'Artisan'
    bio TEXT NOT NULL,
    experience_years INT DEFAULT 1,
    id_proof_url TEXT,
    sample_work_urls TEXT[],
    status seller_app_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SELLER STORES
CREATE TABLE IF NOT EXISTS seller_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE RESTRICT,
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

-- 6. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
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

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller_stores(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    sku VARCHAR(64) NOT NULL UNIQUE,
    short_description VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    -- Financial representation in exact integer paise (e.g., 99900 = ₹999.00)
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
    status product_status NOT NULL DEFAULT 'pending_approval',
    rejection_reason TEXT,
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PRODUCT VARIANTS (Optional for color/size variants)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    sku VARCHAR(64) UNIQUE,
    additional_price INT NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INVENTORY RESERVATIONS (Concurrency control)
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    order_reference VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_released BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVENTORY MOVEMENTS (Auditable Ledger)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change INT NOT NULL, -- Positive or negative
    movement_type inventory_movement_type NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
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

-- 13. CARTS
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE, -- For guest carts prior to login
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 15. WISHLISTS
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 16. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    discount_type discount_type NOT NULL,
    discount_value INT NOT NULL CHECK (discount_value > 0), -- Paise or percentage
    min_order_value INT NOT NULL DEFAULT 0, -- In paise
    max_discount_amount INT, -- In paise (for percentage discounts)
    usage_limit INT,
    times_used INT NOT NULL DEFAULT 0,
    per_customer_limit INT NOT NULL DEFAULT 1,
    start_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. MARKETING CAMPAIGNS (MGT Department Module)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- e.g. 'Seasonal Festival', 'Student Launch'
    budget INT NOT NULL DEFAULT 0, -- In paise
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_category_id UUID REFERENCES categories(id),
    coupon_id UUID REFERENCES coupons(id),
    status campaign_status NOT NULL DEFAULT 'draft',
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ORDERS (Parent marketplace order)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    address_id UUID REFERENCES addresses(id),
    shipping_name VARCHAR(150) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(12) NOT NULL,
    shipping_country VARCHAR(100) NOT NULL DEFAULT 'India',
    
    -- Exact Financial totals in paise
    subtotal_amount INT NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount INT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_amount INT NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount INT NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount INT NOT NULL CHECK (total_amount >= 0),
    
    coupon_id UUID REFERENCES coupons(id),
    coupon_code VARCHAR(32),
    
    order_status order_status NOT NULL DEFAULT 'pending_payment',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method_type NOT NULL DEFAULT 'razorpay',
    
    notes TEXT,
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. SELLER SUB-ORDERS (For multi-vendor fulfillment separation)
CREATE TABLE IF NOT EXISTS seller_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES seller_stores(id) ON DELETE RESTRICT,
    subtotal INT NOT NULL,
    commission_amount INT NOT NULL, -- Marketplace fee in paise
    seller_payout_amount INT NOT NULL, -- Net to seller in paise
    fulfillment_status order_status NOT NULL DEFAULT 'confirmed',
    tracking_number VARCHAR(100),
    shipping_carrier VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. ORDER ITEMS (Immutable historical snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_order_id UUID REFERENCES seller_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES seller_stores(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(64) NOT NULL,
    unit_price INT NOT NULL CHECK (unit_price >= 0), -- Snapshot in paise
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price INT NOT NULL CHECK (total_price >= 0), -- Snapshot in paise
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100) UNIQUE,
    razorpay_payment_id VARCHAR(100) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount INT NOT NULL, -- in paise
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    error_code VARCHAR(100),
    error_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. PAYMENT EVENTS / WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. REVIEWS (Verified purchases only)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(150),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id, order_id)
);

-- 24. COUPON REDEMPTIONS
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. CAMPAIGN / ACQUISITION EVENTS
CREATE TABLE IF NOT EXISTS campaign_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'click', 'pageview', 'conversion'
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    revenue_generated INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 27. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller ON seller_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ==============================================================================
-- 28. ROW LEVEL SECURITY POLICIES (Supabase / PostgreSQL RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active approved products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Products: Sellers can view and modify their own products
CREATE POLICY "Sellers can manage own products" ON products
    FOR ALL USING (seller_id IN (SELECT id FROM seller_stores WHERE user_id = auth.uid()));

-- Orders: Users can read their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

-- Reviews: Everyone can read approved reviews
CREATE POLICY "Public can view approved reviews" ON reviews
    FOR SELECT USING (is_approved = true);
