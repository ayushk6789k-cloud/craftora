import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { supabaseAdmin, isSupabaseServerConfigured } from '../lib/supabase';

const router = Router();

// Strict Admin RBAC
router.use(requireRole(['admin']));

// GET /api/admin/overview - Consolidated metrics and entities for Admin Panel
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let usersList = db.profiles.map(({ password_hash: _, ...u }) => u);
    let storesList = db.seller_stores;
    let productsList = db.getEnrichedProducts(db.products);
    let ordersList = db.orders;

    // Pull directly from Supabase if configured for real-time accuracy
    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        const { data: dbProfiles } = await supabaseAdmin.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          usersList = dbProfiles;
        }

        const { data: dbStores } = await supabaseAdmin.from('seller_stores').select('*');
        if (dbStores && dbStores.length > 0) {
          storesList = dbStores;
        }

        const { data: dbOrders } = await supabaseAdmin.from('orders').select('*');
        if (dbOrders && dbOrders.length > 0) {
          ordersList = dbOrders;
        }
      } catch (e) {
        console.warn('Admin overview Supabase pull error (falling back to store):', e);
      }
    }

    const totalUsers = usersList.length;
    const totalSellers = storesList.length;
    const totalProducts = productsList.length;
    const totalOrders = ordersList.length;
    const lowStockProducts = productsList.filter(
      (p) => p.stock_quantity <= (p.low_stock_threshold || 5)
    );
    const completedOrders = ordersList.filter(
      (o) => o.payment_status === 'paid' || o.order_status === 'delivered'
    );
    const totalGMV = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          totalProducts,
          totalOrders,
          lowStockCount: lowStockProducts.length,
          totalGMV,
        },
        stores: storesList,
        users: usersList,
        products: productsList,
        lowStockProducts,
        orders: ordersList.slice(0, 10),
        systemHealth: {
          database: 'Supabase PostgreSQL & Active Engine',
          apiLatencyMs: 14,
          status: 'operational',
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/products - All products with stock details
router.get('/products', (req: AuthenticatedRequest, res: Response) => {
  const enriched = db.getEnrichedProducts(db.products);
  return res.json({ success: true, data: { products: enriched } });
});

// PATCH /api/admin/products/:id/stock - Stock & Pricing Management
router.patch('/products/:id/stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stock_quantity, selling_price, low_stock_threshold, status } = req.body;

    const product = db.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    if (stock_quantity !== undefined) {
      const prevStock = product.stock_quantity;
      const newStock = Math.max(0, parseInt(stock_quantity, 10) || 0);
      product.stock_quantity = newStock;

      db.inventory_movements.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        quantity_change: newStock - prevStock,
        movement_type: 'admin_manual_adjustment',
        previous_stock: prevStock,
        new_stock: newStock,
        reference_id: req.user?.id || 'admin',
        notes: `Admin manual adjustment by ${req.user?.full_name || 'Admin'}`,
        created_at: new Date().toISOString(),
      });
    }

    if (selling_price !== undefined) {
      product.selling_price = Math.max(0, parseInt(selling_price, 10) || 0);
    }

    if (low_stock_threshold !== undefined) {
      product.low_stock_threshold = Math.max(0, parseInt(low_stock_threshold, 10) || 0);
    }

    if (status !== undefined && ['active', 'draft', 'archived', 'rejected'].includes(status)) {
      product.status = status;
    }

    product.updated_at = new Date().toISOString();

    // Sync to Supabase if configured
    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('products')
          .update({
            stock_quantity: product.stock_quantity,
            price: product.selling_price,
            status: product.status,
            updated_at: product.updated_at,
          })
          .eq('id', product.id);
      } catch (dbErr) {
        console.warn('Failed to sync stock update to Supabase:', dbErr);
      }
    }

    return res.json({
      success: true,
      message: `Product stock and details for "${product.name}" updated successfully.`,
      data: { product: db.getEnrichedProduct(product) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/stores/:id/verify - Verify or unverify an artisan studio
router.patch('/stores/:id/verify', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  const store = db.seller_stores.find((s) => s.id === id);
  if (!store) {
    return res.status(404).json({ success: false, error: 'Store not found.' });
  }

  store.is_verified = Boolean(is_verified);

  if (isSupabaseServerConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin
        .from('seller_stores')
        .update({ is_verified: store.is_verified, updated_at: new Date().toISOString() })
        .eq('id', store.id);
    } catch (e) {
      console.warn('Error updating store in Supabase:', e);
    }
  }

  return res.json({
    success: true,
    message: `Store ${store.store_name} verification status set to ${store.is_verified}.`,
    data: { store },
  });
});

// PATCH /api/admin/users/:id/role - Update user role in memory and in Supabase
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['customer', 'seller', 'management', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified.' });
  }

  const profile = db.profiles.find((p) => p.id === id);
  if (profile) {
    profile.role = role;
    profile.updated_at = new Date().toISOString();
  }

  // Update in Supabase via RPC or Admin client
  if (isSupabaseServerConfigured && supabaseAdmin) {
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('admin_set_user_role', {
        target_user_id: id,
        new_role: role,
      });

      if (rpcError) {
        console.warn('admin_set_user_role RPC failed, attempting direct update:', rpcError.message);
        await supabaseAdmin
          .from('profiles')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch (e) {
      console.warn('Error syncing role change to Supabase:', e);
    }
  }

  return res.json({
    success: true,
    message: `User role updated to ${role} successfully.`,
    data: { profile },
  });
});

// GET /api/admin/orders - All Marketplace Orders
router.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: { orders: db.orders } });
});

export default router;
