export type UserRole = 'customer' | 'seller' | 'management' | 'admin';
export type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded';
export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'rejected' | 'archived';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  bio?: string;
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
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  productCount?: number;
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
  average_rating: number;
  review_count: number;
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
  unit_price: number;
  total_price: number;
  is_available: boolean;
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
  seller_name?: string;
  items?: OrderItem[];
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
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
  total_amount: number;
  coupon_code?: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: 'razorpay' | 'cod' | 'demo_payment';
  created_at: string;
  items?: OrderItem[];
  seller_orders?: SellerOrder[];
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
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number;
  usage_limit?: number;
  times_used: number;
  expiry_date: string;
  is_active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
  utm_source?: string;
  utm_campaign?: string;
}

// Helpers for currency formatting
export function formatPaise(paise: number): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0.00';
  const rupees = (paise / 100).toFixed(2);
  // Indian currency commas formatting
  const parts = rupees.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `₹${formattedInteger}.${decimalPart}`;
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise / 100);
}
