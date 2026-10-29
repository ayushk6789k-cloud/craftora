# Craftora - REST API Documentation

Base URL: `/api`

All JSON responses follow standard HTTP status codes and structured formats:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```
Error Response:
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

---

## 1. Authentication & Identity
- `POST /api/auth/register`
  - Body: `{ email, password, full_name, role?: 'customer' | 'seller' }`
  - Response: `{ user, token }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ user, token }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: Current user profile + seller store info if role is seller
- `PATCH /api/auth/profile`
  - Updates name, phone, bio, avatar
- `POST /api/auth/switch-demo-role` (Demo utility for college presentation)
  - Allows seamless switching between Demo Customer, FD Student Seller, MGT Lead, and ET Admin.

---

## 2. Product Catalog
- `GET /api/products`
  - Query params: `category`, `search`, `min_price`, `max_price`, `material`, `sort` (`newest`, `price_asc`, `price_desc`, `rating`), `page`, `limit`
  - Returns: Paginated list of approved active products with seller store details
- `GET /api/products/:slugOrId`
  - Returns: Detailed product record including multiple high-res gallery images, artisan story, materials, and verified reviews
- `GET /api/categories`
  - Returns: Active taxonomy categories with item counts

---

## 3. Cart & Wishlist
- `GET /api/cart`
  - Returns: Active cart items with current live pricing, stock validation, and item totals
- `POST /api/cart/items`
  - Body: `{ product_id, quantity }`
  - Validates available stock before adding
- `PATCH /api/cart/items/:id`
  - Body: `{ quantity }`
- `DELETE /api/cart/items/:id`
- `POST /api/cart/merge`
  - Merges guest cart items with authenticated user cart upon login
- `GET /api/wishlist`
- `POST /api/wishlist`
  - Body: `{ product_id }`
- `DELETE /api/wishlist/:productId`

---

## 4. Checkout & Orders
- `POST /api/orders/calculate`
  - Body: `{ items: [{ product_id, quantity }], coupon_code?: string }`
  - Calculates server-side subtotal, verified coupon discount, shipping fee, and exact total
- `POST /api/orders`
  - Body: `{ items, shipping_address, payment_method, coupon_code }`
  - Atomically reserves inventory and creates master order + seller suborders
- `GET /api/orders`
  - Returns orders placed by the authenticated customer
- `GET /api/orders/:id`
  - Returns specific order details, shipping timeline, and seller sub-orders
- `POST /api/orders/:id/cancel`
  - Releases inventory reservations and sets status to cancelled

---

## 5. Payments (Razorpay Integration)
- `POST /api/payments/create-order`
  - Body: `{ order_id }`
  - Validates order and creates Razorpay Order via Razorpay server API
  - Returns: `{ razorpay_order_id, amount, currency, key_id }`
- `POST /api/payments/verify`
  - Body: `{ order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  - Verifies HMAC SHA256 signature using `RAZORPAY_KEY_SECRET`
  - Updates order status to `confirmed` and payment status to `paid`
- `POST /api/webhooks/razorpay`
  - Idempotently processes payment captured/failed events from Razorpay webhooks

---

## 6. Seller Portal
- `GET /api/seller/dashboard`
  - Returns: Gross sales, active listings, pending orders, inventory alerts
- `GET /api/seller/products`
  - Returns: All products owned by the authenticated seller (including drafts and pending)
- `POST /api/seller/products`
  - Creates new handcrafted product listing with materials, care instructions, and pricing
- `PATCH /api/seller/products/:id`
- `DELETE /api/seller/products/:id`
- `GET /api/seller/orders`
  - Returns orders containing products from this artisan
- `PATCH /api/seller/orders/:sellerOrderId/fulfillment`
  - Updates shipping status (`processing`, `packed`, `shipped`, `delivered`) and tracking number
- `PATCH /api/seller/storefront`
  - Updates store banner, logo, tagline, bio, and handmade philosophy

---

## 7. Management Portal (MGT Department)
- `GET /api/management/analytics`
  - Returns: Gross Merchandise Value (GMV), net marketplace revenue, estimated margins, category breakdown, seller performance
- `GET /api/management/campaigns`
- `POST /api/management/campaigns`
  - Creates new marketing campaign with category targeting and UTM parameters
- `GET /api/management/coupons`
- `POST /api/management/coupons`
  - Creates discount codes (percentage/fixed) with validity windows and limits
- `GET /api/management/pricing-analysis`
  - Profit margin simulator and price-to-cost ratio metrics

---

## 8. Administrator Portal (ET / Platform Admin)
- `GET /api/admin/dashboard`
  - Comprehensive platform metrics (users, sellers, listings, GMV, orders)
- `GET /api/admin/sellers`
  - Review seller applications
- `PATCH /api/admin/sellers/:id/approve`
- `PATCH /api/admin/sellers/:id/reject`
- `GET /api/admin/products/pending`
- `PATCH /api/admin/products/:id/moderate`
  - Approve or reject product listing with reason
- `GET /api/admin/orders`
- `GET /api/admin/audit-logs`
