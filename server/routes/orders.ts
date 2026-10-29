import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { Order, OrderItem, SellerOrder } from '../types';
import { supabaseAdmin, isSupabaseServerConfigured } from '../lib/supabase';

const router = Router();

// POST /api/orders/calculate - Pure server-side pricing engine
router.post('/calculate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, coupon_code } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided for calculation.' });
    }

    let subtotal = 0;
    const validatedItems: { product_id: string; name: string; unit_price: number; quantity: number; total: number }[] = [];

    for (const it of items) {
      const product = db.products.find((p) => p.id === it.product_id);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product not found: ${it.product_id}` });
      }
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const lineTotal = product.selling_price * qty;
      subtotal += lineTotal;

      validatedItems.push({
        product_id: product.id,
        name: product.name,
        unit_price: product.selling_price,
        quantity: qty,
        total: lineTotal,
      });
    }

    // Coupon logic
    let discountAmount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const codeClean = coupon_code.trim().toUpperCase();
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === codeClean && c.is_active);

      if (coupon) {
        const now = new Date();
        const validTime = now >= new Date(coupon.start_date) && now <= new Date(coupon.expiry_date);
        const meetsMin = subtotal >= coupon.min_order_value;
        const underLimit = !coupon.usage_limit || coupon.times_used < coupon.usage_limit;

        if (validTime && meetsMin && underLimit) {
          if (coupon.discount_type === 'percentage') {
            const rawDiscount = Math.round((subtotal * coupon.discount_value) / 100);
            discountAmount = coupon.max_discount_amount
              ? Math.min(rawDiscount, coupon.max_discount_amount)
              : rawDiscount;
          } else {
            discountAmount = Math.min(coupon.discount_value, subtotal);
          }
          appliedCoupon = {
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount,
          };
        }
      }
    }

    // Shipping rules: Free delivery on handcrafted orders above ₹999 (99900 paise), else ₹79 (7900 paise)
    const FREE_SHIPPING_THRESHOLD = 99900;
    const standardShipping = 7900;
    const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : standardShipping;

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    return res.json({
      success: true,
      data: {
        subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        applied_coupon: appliedCoupon,
        items: validatedItems,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders - Create Order and persist directly in Supabase PostgreSQL
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      items,
      shipping_address,
      payment_method = 'razorpay',
      coupon_code,
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Shopping cart is empty.' });
    }

    if (!shipping_address || !shipping_address.full_name || !shipping_address.address_line1 || !shipping_address.city || !shipping_address.postal_code) {
      return res.status(400).json({ success: false, error: 'Complete delivery address is required.' });
    }

    // 1. Check Indian PIN code format (6 digits)
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(shipping_address.postal_code.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `CRF-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Atomic Inventory Reservation
    const stockItems = items.map((i) => ({
      product_id: i.product_id,
      quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
    }));

    const reserved = db.checkAndReserveStock(stockItems, orderNumber);
    if (!reserved) {
      return res.status(400).json({
        success: false,
        error: 'One or more handcrafted items are out of stock. Stock availability was refreshed.',
      });
    }

    // 3. Server-side totals calculation
    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const sellerBuckets = new Map<string, { seller_id: string; subtotal: number; items: OrderItem[] }>();

    for (const it of items) {
      const product = db.products.find((p) => p.id === it.product_id)!;
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const lineTotal = product.selling_price * qty;
      subtotal += lineTotal;

      const orderItem: OrderItem = {
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: product.id,
        seller_id: product.seller_id,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.selling_price,
        quantity: qty,
        total_price: lineTotal,
      };
      orderItems.push(orderItem);

      // Group by seller for multi-vendor fulfillment
      if (!sellerBuckets.has(product.seller_id)) {
        sellerBuckets.set(product.seller_id, {
          seller_id: product.seller_id,
          subtotal: 0,
          items: [],
        });
      }
      const b = sellerBuckets.get(product.seller_id)!;
      b.subtotal += lineTotal;
      b.items.push(orderItem);
    }

    // 4. Coupon Discount
    let discountAmount = 0;
    if (coupon_code) {
      const cCode = coupon_code.trim().toUpperCase();
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === cCode && c.is_active);
      if (coupon && subtotal >= coupon.min_order_value) {
        if (coupon.discount_type === 'percentage') {
          const raw = Math.round((subtotal * coupon.discount_value) / 100);
          discountAmount = coupon.max_discount_amount ? Math.min(raw, coupon.max_discount_amount) : raw;
        } else {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
        coupon.times_used += 1;
      }
    }

    const shippingAmount = subtotal >= 99900 ? 0 : 7900;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    // 5. Partition into Seller Orders
    const sellerOrders: SellerOrder[] = [];
    for (const [sId, bucket] of sellerBuckets.entries()) {
      const store = db.seller_stores.find((s) => s.id === sId);
      const commissionRate = store?.commission_rate_percentage || 10.0;
      const commissionAmount = Math.round((bucket.subtotal * commissionRate) / 100);
      const sellerPayout = Math.max(0, bucket.subtotal - commissionAmount);

      const sOrder: SellerOrder = {
        id: crypto.randomUUID(),
        order_id: orderId,
        seller_id: sId,
        seller_name: store?.store_name || 'Artisan Studio',
        subtotal: bucket.subtotal,
        commission_amount: commissionAmount,
        seller_payout_amount: sellerPayout,
        fulfillment_status: payment_method === 'cod' ? 'confirmed' : 'pending_payment',
        items: bucket.items,
      };

      sellerOrders.push(sOrder);
      db.seller_orders.push(sOrder);
    }

    const orderStatus = payment_method === 'cod' ? 'confirmed' : 'pending_payment';
    const paymentStatus = payment_method === 'cod' ? 'pending' : 'pending';

    // 6. Master Order Record
    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: user.id,
      shipping_name: shipping_address.full_name,
      shipping_phone: shipping_address.phone,
      shipping_address_line1: shipping_address.address_line1,
      shipping_address_line2: shipping_address.address_line2 || '',
      shipping_city: shipping_address.city,
      shipping_state: shipping_address.state,
      shipping_postal_code: shipping_address.postal_code,
      shipping_country: shipping_address.country || 'India',
      subtotal_amount: subtotal,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      coupon_code,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
      seller_orders: sellerOrders,
    };

    // 7. REAL SUPABASE POSTGRESQL INSERT
    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        // Insert into public.orders
        const { error: orderInsertErr } = await supabaseAdmin.from('orders').insert({
          id: orderId,
          user_id: user.id,
          order_number: orderNumber,
          shipping_address: {
            full_name: shipping_address.full_name,
            phone: shipping_address.phone,
            address_line1: shipping_address.address_line1,
            address_line2: shipping_address.address_line2 || '',
            city: shipping_address.city,
            state: shipping_address.state,
            postal_code: shipping_address.postal_code,
            country: shipping_address.country || 'India',
          },
          subtotal_amount: subtotal,
          discount_amount: discountAmount,
          shipping_fee: shippingAmount,
          total_amount: totalAmount,
          status: orderStatus,
          payment_status: paymentStatus,
          notes: notes || null,
        });

        if (orderInsertErr) {
          console.error('Error inserting order into Supabase:', orderInsertErr);
        } else {
          // Insert order items
          for (const it of orderItems) {
            await supabaseAdmin.from('order_items').insert({
              id: it.id,
              order_id: orderId,
              product_id: it.product_id,
              seller_id: it.seller_id,
              product_name: it.product_name,
              quantity: it.quantity,
              unit_price: it.unit_price,
              total_price: it.total_price,
            });
          }

          // Insert payment record
          await supabaseAdmin.from('payments').insert({
            order_id: orderId,
            amount: totalAmount,
            currency: 'INR',
            status: paymentStatus,
            payment_method: payment_method,
          });

          // Clear user's database cart
          const { data: dbCart } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (dbCart) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', dbCart.id);
          }
        }
      } catch (dbErr) {
        console.error('Failed to persist order to Supabase:', dbErr);
      }
    }

    // Sync memory
    db.orders.unshift(newOrder);
    for (const item of orderItems) {
      db.order_items.push(item);
    }

    // Clear memory cart
    const userCart = db.carts.find((c) => c.user_id === user.id);
    if (userCart) {
      db.cart_items = db.cart_items.filter((ci) => ci.cart_id !== userCart.id);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed and saved successfully in database.',
      data: {
        order: newOrder,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to format Supabase order row into full Order object
function formatDbOrder(dbOrder: any, dbItems: any[] = []): Order {
  const addr = dbOrder.shipping_address || {};
  return {
    id: dbOrder.id,
    order_number: dbOrder.order_number,
    user_id: dbOrder.user_id,
    shipping_name: addr.full_name || '',
    shipping_phone: addr.phone || '',
    shipping_address_line1: addr.address_line1 || '',
    shipping_address_line2: addr.address_line2 || '',
    shipping_city: addr.city || '',
    shipping_state: addr.state || '',
    shipping_postal_code: addr.postal_code || '',
    shipping_country: addr.country || 'India',
    subtotal_amount: dbOrder.subtotal_amount,
    discount_amount: dbOrder.discount_amount || 0,
    shipping_amount: dbOrder.shipping_fee || 0,
    tax_amount: 0,
    total_amount: dbOrder.total_amount,
    order_status: (dbOrder.status || 'confirmed') as any,
    payment_status: (dbOrder.payment_status || 'paid') as any,
    payment_method: 'razorpay',
    notes: dbOrder.notes || '',
    created_at: dbOrder.created_at,
    updated_at: dbOrder.updated_at,
    items: dbItems.map((i) => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id,
      seller_id: i.seller_id,
      product_name: i.product_name,
      product_sku: i.product_sku || 'CRF-ARTISAN',
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
    })),
  };
}

// GET /api/orders - Real User Order History from Supabase
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (user.role !== 'admin' && user.role !== 'management') {
          query = query.eq('user_id', user.id);
        }

        const { data: dbOrders, error: ordersErr } = await query;

        if (!ordersErr && Array.isArray(dbOrders) && dbOrders.length > 0) {
          const orderIds = dbOrders.map((o) => o.id);
          const { data: dbItems } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          const formattedOrders = dbOrders.map((o) => {
            const items = (dbItems || []).filter((it) => it.order_id === o.id);
            return formatDbOrder(o, items);
          });

          return res.json({
            success: true,
            data: { orders: formattedOrders },
          });
        }
      } catch (dbErr) {
        console.warn('Database orders fetch fallback:', dbErr);
      }
    }

    // In-memory fallback
    const userOrders = db.orders.filter((o) => o.user_id === user.id);
    return res.json({
      success: true,
      data: { orders: userOrders },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - Single Order Details (for Receipt and Verification)
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        const { data: dbOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .or(`id.eq.${id},order_number.eq.${id}`)
          .maybeSingle();

        if (dbOrder) {
          if (dbOrder.user_id !== user.id && user.role !== 'admin' && user.role !== 'management') {
            return res.status(403).json({ success: false, error: 'Access forbidden.' });
          }

          const { data: dbItems } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', dbOrder.id);

          const formatted = formatDbOrder(dbOrder, dbItems || []);
          return res.json({
            success: true,
            data: { order: formatted },
          });
        }
      } catch (dbErr) {
        console.warn('Database single order fetch fallback:', dbErr);
      }
    }

    const order = db.orders.find((o) => o.id === id || o.order_number === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.user_id !== user.id && user.role !== 'admin' && user.role !== 'management') {
      return res.status(403).json({ success: false, error: 'Access forbidden.' });
    }

    return res.json({
      success: true,
      data: { order },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/:id/cancel - Customer Cancellation in Supabase
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        const { data: dbOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (dbOrder) {
          if (dbOrder.user_id !== user.id && user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized to cancel this order.' });
          }

          if (['shipped', 'delivered', 'cancelled'].includes(dbOrder.status)) {
            return res.status(400).json({
              success: false,
              error: `Order cannot be cancelled in its current state (${dbOrder.status}).`,
            });
          }

          await supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', id);
        }
      } catch (e) {
        console.warn('Database cancel error:', e);
      }
    }

    const order = db.orders.find((o) => o.id === id);
    if (order) {
      order.order_status = 'cancelled';
      order.updated_at = new Date().toISOString();
    }

    return res.json({
      success: true,
      message: 'Order cancelled successfully and database status updated.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
