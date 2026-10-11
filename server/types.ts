export type UserRole = 'customer' | 'seller' | 'management' | 'admin';
export type SellerAppStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'rejected' | 'archived';
export type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded';
export type PaymentMethod = 'razorpay' | 'cod' | 'demo_payment';
export type DiscountType = 'percentage' | 'fixed_amount';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  bio?: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface SellerStore {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  tagline: string;
  story: string;
  logo_url: string;
  banner_url: string;
  city: string;
  state: string;
  country: string;
  instagram_handle?: string;
  is_verified: boolean;
  is_active: boolean;
  commission_rate_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  base_price: number; // in paise
  selling_price: number; // in paise
  cost_price: number; // in paise
  stock_quantity: number;
  low_stock_threshold: number;
  material: string;
  color: string;
  dimensions?: string;
  weight_grams?: number;
  care_instructions?: string;
  handmade_technique?: string;
  customization_available: boolean;
  processing_time_days: number;
  status: ProductStatus;
  rejection_reason?: string;
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  // Joins
  images?: ProductImage[];
  category?: Category;
  seller?: SellerStore;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  seller_order_id?: string;
  product_id: string;
  seller_id: string;
  product_name: string;
  product_sku: string;
  unit_price: number; // in paise
  quantity: number;
  total_price: number; // in paise
}

export interface SellerOrder {
  id: string;
  order_id: string;
  seller_id: string;
  subtotal: number;
  commission_amount: number;
  seller_payout_amount: number;
  fulfillment_status: OrderStatus;
  tracking_number?: string;
  shipping_carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
  seller_name?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  address_id?: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  coupon_code?: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  seller_orders?: SellerOrder[];
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // Paise or percentage
  min_order_value: number; // in paise
  max_discount_amount?: number; // in paise
  usage_limit?: number;
  times_used: number;
  per_customer_limit: number;
  start_date: string;
  expiry_date: string;
  is_active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  budget: number; // in paise
  start_date: string;
  end_date: string;
  target_category_id?: string;
  coupon_id?: string;
  status: CampaignStatus;
  utm_source?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface SellerApplication {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  store_name: string;
  craft_type: string;
  department: string;
  bio: string;
  experience_years: number;
  status: SellerAppStatus;
  rejection_reason?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  created_at: string;
}
