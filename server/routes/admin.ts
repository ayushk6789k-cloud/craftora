import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Strict Admin RBAC
router.use(requireRole(['admin']));

// GET /api/admin/dashboard - Core Platform Health
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = db.profiles.length;
  const totalSellers = db.seller_stores.length;
  const pendingSellerApps = db.seller_applications.filter((a) => a.status === 'pending').length;
  const totalProducts = db.products.length;
  const pendingProducts = db.products.filter((p) => p.status === 'pending_approval').length;
  const totalOrders = db.orders.length;
  const completedOrders = db.orders.filter(
    (o) => o.payment_status === 'paid' || o.order_status === 'delivered'
  );
  const totalGMV = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalSellers,
        pendingSellerApps,
        totalProducts,
        pendingProducts,
        totalOrders,
        completedOrdersCount: completedOrders.length,
        totalGMV, // in paise
      },
      recentOrders: db.orders.slice(0, 5),
      recentAuditLogs: db.audit_logs.slice(0, 8),
    },
  });
});

// GET /api/admin/users
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const safeUsers = db.profiles.map(({ password_hash: _, ...u }) => u);
  return res.json({ success: true, data: { users: safeUsers } });
});

// GET /api/admin/sellers - Applications & Stores
router.get('/sellers', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      applications: db.seller_applications,
      stores: db.seller_stores,
    },
  });
});

// PATCH /api/admin/sellers/:id/approve - Approve Seller Application
router.patch('/sellers/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const app = db.seller_applications.find((a) => a.id === id);

  if (!app) {
    return res.status(404).json({ success: false, error: 'Seller application not found.' });
  }

  app.status = 'approved';

  // Promote user role
  const user = db.profiles.find((p) => p.id === app.user_id);
  if (user) {
    user.role = 'seller';
    user.updated_at = new Date().toISOString();
  }

  // Ensure seller store exists and is verified
  let store = db.seller_stores.find((s) => s.user_id === app.user_id);
  if (!store) {
    const slug = app.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-studio';
    store = {
      id: crypto.randomUUID(),
      user_id: app.user_id,
      store_name: app.store_name,
      slug,
      tagline: `${app.craft_type} Artisan`,
      story: app.bio,
      logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      city: 'Campus Studio',
      state: 'Handmade Wing',
      country: 'India',
      is_verified: true,
      is_active: true,
      commission_rate_percentage: 10.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.seller_stores.push(store);
  } else {
    store.is_verified = true;
    store.is_active = true;
  }

  // Audit log
  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_id: req.user?.id,
    actor_name: req.user?.full_name,
    action: 'APPROVE_SELLER_APPLICATION',
    entity_type: 'SELLER',
    entity_id: app.id,
    details: { store_name: app.store_name, user_email: app.user_email },
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Seller application for ${app.store_name} approved!`,
    data: { application: app, store },
  });
});

// PATCH /api/admin/sellers/:id/reject - Reject Seller Application
router.patch('/sellers/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const app = db.seller_applications.find((a) => a.id === id);

  if (!app) {
    return res.status(404).json({ success: false, error: 'Seller application not found.' });
  }

  app.status = 'rejected';
  app.rejection_reason = rejection_reason || 'Does not meet current catalog requirements.';

  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_id: req.user?.id,
    actor_name: req.user?.full_name,
    action: 'REJECT_SELLER_APPLICATION',
    entity_type: 'SELLER',
    entity_id: app.id,
    details: { rejection_reason: app.rejection_reason },
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, message: 'Application marked as rejected.', data: { application: app } });
});

// GET /api/admin/products - All products for moderation
router.get('/products', (req: AuthenticatedRequest, res: Response) => {
  const enriched = db.getEnrichedProducts(db.products);
  return res.json({ success: true, data: { products: enriched } });
});

// PATCH /api/admin/products/:id/moderate - Moderate Product
router.patch('/products/:id/moderate', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }

  if (!['active', 'rejected', 'archived'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid product status.' });
  }

  product.status = status;
  if (rejection_reason) product.rejection_reason = rejection_reason;
  product.updated_at = new Date().toISOString();

  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_id: req.user?.id,
    actor_name: req.user?.full_name,
    action: `MODERATE_PRODUCT_${status.toUpperCase()}`,
    entity_type: 'PRODUCT',
    entity_id: product.id,
    details: { name: product.name, status, rejection_reason },
    created_at: new Date().toISOString(),
  });

  return res.json({ success: true, message: `Product status updated to ${status}.`, data: { product } });
});

// GET /api/admin/orders - All Marketplace Orders
router.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: { orders: db.orders } });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, data: { audit_logs: db.audit_logs } });
});

export default router;
