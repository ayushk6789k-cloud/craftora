import { supabaseAdmin, isSupabaseServerConfigured, supabaseServerConfig } from '../lib/supabase';
import { Product, Order, UserProfile, Category, CartItem } from '../types';

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  tablesFound: boolean;
  error?: string;
  url: string;
  hasServiceRoleKey: boolean;
  hasKey: boolean;
}

// Check database connectivity and table readiness
export async function checkDatabaseConnection(): Promise<DbStatus> {
  const status: DbStatus = {
    configured: isSupabaseServerConfigured,
    connected: false,
    tablesFound: false,
    url: supabaseServerConfig.url,
    hasServiceRoleKey: supabaseServerConfig.hasServiceRoleKey,
    hasKey: supabaseServerConfig.hasKey,
  };

  if (!isSupabaseServerConfigured || !supabaseAdmin) {
    status.error = 'Supabase environment variables (VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) are not set.';
    return status;
  }

  try {
    // Attempt a light query to verify network connectivity and table existence
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('Could not find the table')
      ) {
        // Connected successfully to project, but public.profiles migration has not been applied yet
        status.connected = true;
        status.tablesFound = false;
        status.error = 'Connected to Supabase PostgreSQL, but public.profiles table is missing. Run the SQL migration script in your Supabase SQL Editor.';
      } else {
        status.connected = false;
        status.error = `Supabase query error: ${error.message} (Code: ${error.code})`;
      }
      return status;
    }

    status.connected = true;
    status.tablesFound = true;
    return status;
  } catch (err: any) {
    status.connected = false;
    status.error = `Network/DNS error connecting to Supabase: ${err.message || String(err)}`;
    return status;
  }
}

// Database Service operations against persistent Supabase PostgreSQL
export const supabaseDb = {
  // PROFILES
  async getProfile(userId: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listProfiles() {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // CATEGORIES
  async getCategories() {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // PRODUCTS
  async getProducts(params: {
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    seller_id?: string;
    limit?: number;
    page?: number;
  }) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    let query = supabaseAdmin
      .from('products')
      .select('*, images:product_images(*), seller:seller_stores(*), category:categories(*)')
      .eq('status', 'active');

    if (params.category) {
      query = query.eq('category_id', params.category);
    }
    if (params.seller_id) {
      query = query.eq('seller_id', params.seller_id);
    }
    if (params.min_price) {
      query = query.gte('selling_price', params.min_price);
    }
    if (params.max_price) {
      query = query.lte('selling_price', params.max_price);
    }
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getProductById(productId: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, images:product_images(*), seller:seller_stores(*), category:categories(*)')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createProduct(productData: any, imageUrls: string[] = []) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select()
      .single();
    if (prodError) throw prodError;

    if (imageUrls.length > 0) {
      const imageRecords = imageUrls.map((url, idx) => ({
        product_id: product.id,
        image_url: url,
        is_primary: idx === 0,
        display_order: idx,
      }));
      await supabaseAdmin.from('product_images').insert(imageRecords);
    }

    return product;
  },

  // CARTS
  async getCart(userId?: string, sessionId?: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    let cartQuery = supabaseAdmin.from('carts').select('id, user_id, session_id');
    if (userId) {
      cartQuery = cartQuery.eq('user_id', userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq('session_id', sessionId);
    } else {
      return null;
    }

    const { data: cart, error: cartErr } = await cartQuery.maybeSingle();
    if (cartErr) throw cartErr;
    if (!cart) return null;

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*, images:product_images(*))')
      .eq('cart_id', cart.id);
    if (itemsErr) throw itemsErr;

    return { ...cart, items: items || [] };
  },

  // ORDERS & CHECKOUT
  async createOrder(orderPayload: {
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: any;
    items: Array<{ productId: string; quantity: number; unitPrice: number; total: number }>;
    totalAmount: number;
    paymentMethod: 'demo' | 'cod' | 'razorpay';
    paymentStatus: 'pending' | 'paid';
    notes?: string;
  }) {
    if (!supabaseAdmin) throw new Error('Database disconnected');

    const orderNumber = 'CRF-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: orderPayload.userId || null,
        order_number: orderNumber,
        customer_name: orderPayload.customerName,
        customer_email: orderPayload.customerEmail,
        customer_phone: orderPayload.customerPhone,
        shipping_address: orderPayload.shippingAddress,
        total_amount: orderPayload.totalAmount,
        payment_method: orderPayload.paymentMethod,
        payment_status: orderPayload.paymentStatus,
        order_status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Create Order Items
    const orderItems = orderPayload.items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: it.total,
    }));

    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    // Record payment
    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      amount: orderPayload.totalAmount,
      currency: 'INR',
      status: orderPayload.paymentStatus,
      payment_method: orderPayload.paymentMethod,
      gateway_reference: 'academic_simulated_' + Date.now(),
      created_at: new Date().toISOString(),
    });

    // Record inventory movement
    for (const it of orderPayload.items) {
      await supabaseAdmin.from('inventory_movements').insert({
        product_id: it.productId,
        quantity_change: -it.quantity,
        movement_type: 'order_fulfilled',
        reference_id: order.id,
        notes: `Fulfilled for order ${orderNumber}`,
      });
    }

    return order;
  },

  async getUserOrders(userId: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // SELLER APPLICATIONS & STORES
  async getSellerApplication(userId: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('seller_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getSellerStoreByUserId(userId: string) {
    if (!supabaseAdmin) throw new Error('Database disconnected');
    const { data, error } = await supabaseAdmin
      .from('seller_stores')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
