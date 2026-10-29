-- ==============================================================================
-- CRAFTORA MARKETPLACE - MIGRATION VERIFICATION & HEALTH AUDIT SCRIPT
-- File: supabase/verify_migration.sql
-- Description:
--   Run this in Supabase SQL Editor after executing the migration to verify:
--     1. All 21 marketplace tables exist in public schema
--     2. Row Level Security (RLS) is enabled on every single table
--     3. RLS policy count per table
--     4. Functions, security flags, and search_path configuration
--     5. auth.users signup triggers and profiles guard trigger
-- ==============================================================================

-- 1. VERIFY ALL 21 TABLES AND RLS STATUS
SELECT 
    c.relname AS table_name,
    CASE WHEN c.relrowsecurity THEN 'ENABLED (SECURE)' ELSE 'DISABLED (VULNERABLE!)' END AS rls_status,
    COUNT(p.policyname) AS active_policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname IN (
    'profiles', 'seller_applications', 'seller_stores', 'categories',
    'products', 'product_images', 'product_variants', 'inventory_reservations',
    'inventory_movements', 'addresses', 'carts', 'cart_items',
    'wishlists', 'coupons', 'marketing_campaigns', 'orders',
    'order_items', 'seller_orders', 'payments', 'reviews', 'audit_logs'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- 2. VERIFY SECURITY DEFINER FUNCTIONS & FIXED SEARCH_PATH
SELECT 
    p.proname AS function_name,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER (Active)' ELSE 'SECURITY INVOKER' END AS security_type,
    p.proconfig AS runtime_configuration,
    CASE 
      WHEN 'search_path=public, pg_temp' = ANY(p.proconfig) THEN 'PROTECTED (search_path hardened)'
      ELSE 'WARNING (search_path not fixed)'
    END AS hijack_defense
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'is_admin', 'is_staff', 'is_admin_or_service', 
    'prevent_profile_privilege_escalation', 'admin_set_user_role', 'handle_new_user'
  );

-- 3. VERIFY CRITICAL TRIGGERS
SELECT 
    t.tgname AS trigger_name,
    c.relname AS target_table,
    p.proname AS executed_function,
    CASE WHEN t.tgenabled = 'O' THEN 'ACTIVE' ELSE 'INACTIVE' END AS trigger_status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgname IN ('on_auth_user_created', 'tr_profiles_privilege_guard');

-- 4. SUMMARY COUNT AUDIT (Expected: 21 tables, 21 with RLS enabled)
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_public_tables,
    (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true) AS tables_with_rls_enabled,
    (SELECT COUNT(*) FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public') AS total_rls_policies;
