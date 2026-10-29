# Craftora - Database Schema & Data Dictionary

## Architecture Overview
The Craftora database is built on **PostgreSQL (Supabase)** with Row Level Security (RLS) policies, UUID primary keys, auditable inventory ledgers, and exact integer currency representation.

### Currency Rule: Exact Integer Paise
To prevent floating-point rounding errors and discrepancy in e-commerce financials:
- All monetary fields (`base_price`, `selling_price`, `cost_price`, `subtotal`, `discount_amount`, `shipping_amount`, `total_amount`, `payout_amount`) are stored as **exact integer paise** in INR (₹1 = 100 paise).
- Example: ₹799.00 is stored as `79900`.
- In the frontend and customer invoices, amounts are rendered using standard Indian Rupee notation (`₹799.00`).

---

## Complete Table Dictionary

### 1. `profiles`
User accounts and persona definitions.
- `id` (UUID, PK): Unique profile identifier
- `auth_user_id` (UUID, Unique): Reference to Supabase Auth `auth.users(id)`
- `email` (VARCHAR(255), Unique, Not Null)
- `full_name` (VARCHAR(150), Not Null)
- `phone` (VARCHAR(20))
- `avatar_url` (TEXT)
- `role` (`user_role`: `'customer' | 'seller' | 'management' | 'admin'`)
- `bio` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `seller_applications`
Student and artisan registration requests before admin approval.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`)
- `store_name` (VARCHAR(150), Not Null)
- `craft_type` (VARCHAR(100), Not Null)
- `department` (VARCHAR(50)): e.g. `'FD'`, `'ET'`, `'Artisan'`
- `bio` (TEXT)
- `experience_years` (INT)
- `status` (`seller_app_status`: `'pending' | 'approved' | 'rejected' | 'suspended'`)
- `reviewer_id` (UUID, FK -> `profiles.id`)
- `rejection_reason` (TEXT)
- `reviewed_at`, `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. `seller_stores`
Public storefront profiles for approved creators.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`, Unique)
- `store_name` (VARCHAR(150), Unique, Not Null)
- `slug` (VARCHAR(180), Unique, Not Null)
- `tagline` (VARCHAR(255))
- `story` (TEXT)
- `logo_url`, `banner_url` (TEXT)
- `city`, `state`, `country` (VARCHAR)
- `instagram_handle` (VARCHAR)
- `is_verified` (BOOLEAN, Default: false)
- `is_active` (BOOLEAN, Default: true)
- `commission_rate_percentage` (NUMERIC(5,2), Default: 10.00%)

### 4. `categories`
Marketplace taxonomy.
- `id` (UUID, PK)
- `name` (VARCHAR(100), Unique, Not Null)
- `slug` (VARCHAR(120), Unique, Not Null)
- `description` (TEXT)
- `image_url` (TEXT)
- `display_order` (INT)
- `is_active` (BOOLEAN)

### 5. `products`
Handcrafted item listings.
- `id` (UUID, PK)
- `seller_id` (UUID, FK -> `seller_stores.id`)
- `category_id` (UUID, FK -> `categories.id`)
- `name` (VARCHAR(255), Not Null)
- `slug` (VARCHAR(280), Unique, Not Null)
- `sku` (VARCHAR(64), Unique, Not Null)
- `short_description`, `description` (TEXT)
- `base_price` (INT, Paise)
- `selling_price` (INT, Paise)
- `cost_price` (INT, Paise, restricted to Seller & Management)
- `stock_quantity` (INT, >= 0)
- `low_stock_threshold` (INT, Default: 5)
- `material`, `color`, `dimensions` (VARCHAR)
- `weight_grams` (INT)
- `care_instructions`, `handmade_technique` (TEXT)
- `customization_available` (BOOLEAN)
- `processing_time_days` (INT)
- `status` (`'draft' | 'pending_approval' | 'active' | 'rejected' | 'archived'`)
- `average_rating` (NUMERIC(3,2))
- `review_count` (INT)

### 6. `product_images`
Multiple high-resolution photos per listing.
- `id` (UUID, PK)
- `product_id` (UUID, FK -> `products.id`)
- `image_url` (TEXT, Not Null)
- `alt_text` (VARCHAR(255))
- `is_primary` (BOOLEAN)
- `display_order` (INT)

### 7. `inventory_movements` & `inventory_reservations`
ACID-safe stock accounting to prevent overselling.
- Tracks movement types: `'initial_stock'`, `'order_reservation'`, `'reservation_released'`, `'order_fulfilled'`, `'manual_adjustment'`
- Atomic reservations with expiration timestamps during checkout.

### 8. `carts` & `cart_items`
Persistent multi-vendor carts with live stock validation.

### 9. `orders`, `seller_orders`, `order_items`
- `orders`: Master order record containing financial breakdown, shipping address snapshot, coupon code applied, and global order status.
- `seller_orders`: Sub-orders partitioned per seller so each artisan fulfills their individual items independently with their own tracking carrier and fulfillment status.
- `order_items`: Permanent snapshot of unit price, quantity, title, and SKU at the moment of checkout.

### 10. `payments` & `payment_events`
- Records Razorpay order ID, payment ID, HMAC signature verification, status, currency, and error log.
- `payment_events`: Idempotent audit log for Razorpay webhooks.

### 11. `coupons` & `coupon_redemptions`
Discount codes created by Management students, supporting percentage and fixed-amount discounts, min order values, per-customer limits, and validity periods.

### 12. `marketing_campaigns` & `campaign_events`
Campaign tracking with UTM attribution (`utm_source`, `utm_campaign`), budget, category targeting, and real conversion tracking.

### 13. `reviews`
Verified buyer reviews with 1-5 star ratings, title, and comments.

### 14. `audit_logs`
Privileged administrator actions tracking (approvals, suspensions, price modifications).
