import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Product, ProductImage } from '../types';

const router = Router();

// Protect all seller routes
router.use(requireRole(['seller', 'admin']));

// GET /api/seller/dashboard - Real Statistics
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id);

  if (!store && user.role !== 'admin') {
    return res.status(404).json({ success: false, error: 'Seller storefront not found for this account.' });
  }

  const storeId = store ? store.id : db.seller_stores[0]?.id;
  const sellerProducts = db.products.filter((p) => p.seller_id === storeId);
  const activeProducts = sellerProducts.filter((p) => p.status === 'active');
  const lowStockProducts = sellerProducts.filter((p) => p.stock_quantity <= p.low_stock_threshold);

  const sellerOrders = db.seller_orders.filter((so) => so.seller_id === storeId);
  const completedOrders = sellerOrders.filter((so) => so.fulfillment_status === 'delivered');
  const pendingOrders = sellerOrders.filter(
    (so) => !['delivered', 'cancelled', 'returned'].includes(so.fulfillment_status)
  );

  const grossSales = sellerOrders.reduce((sum, so) => sum + so.subtotal, 0);
  const estimatedEarnings = sellerOrders.reduce((sum, so) => sum + so.seller_payout_amount, 0);

  // Recent 5 seller orders with customer info
  const recentOrders = sellerOrders.slice(0, 5).map((so) => {
    const parentOrder = db.orders.find((o) => o.id === so.order_id);
    return {
      ...so,
      order_number: parentOrder?.order_number,
      shipping_city: parentOrder?.shipping_city,
      created_at: parentOrder?.created_at,
    };
  });

  return res.json({
    success: true,
    data: {
      store,
      stats: {
        totalProducts: sellerProducts.length,
        activeProducts: activeProducts.length,
        lowStockCount: lowStockProducts.length,
        pendingOrdersCount: pendingOrders.length,
        completedOrdersCount: completedOrders.length,
        grossSales, // in paise
        estimatedEarnings, // in paise
      },
      recentOrders,
      lowStockAlerts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
      })),
    },
  });
});

// GET /api/seller/products - My Products
router.get('/products', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id) || db.seller_stores[0];
  const prods = db.products.filter((p) => p.seller_id === store.id);
  const enriched = db.getEnrichedProducts(prods);

  return res.json({ success: true, data: { products: enriched } });
});

// POST /api/seller/products - Create Product
router.post('/products', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const store = db.seller_stores.find((s) => s.user_id === user.id) || db.seller_stores[0];

    const {
      name,
      category_id,
      short_description,
      description,
      base_price, // in rupees from UI
      selling_price, // in rupees from UI
      cost_price, // in rupees from UI
      stock_quantity,
      low_stock_threshold = 5,
      material,
      color,
      dimensions,
      weight_grams,
      care_instructions,
      handmade_technique,
      customization_available = false,
      processing_time_days = 2,
      images, // array of image URLs
    } = req.body;

    if (!name || !category_id || !short_description || !selling_price || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product name, category, short description, selling price, and stock quantity are required.',
      });
    }

    // Convert INR rupees to integer paise
    const sellingPaise = Math.round(Number(selling_price) * 100);
    const basePaise = base_price ? Math.round(Number(base_price) * 100) : sellingPaise;
    const costPaise = cost_price ? Math.round(Number(cost_price) * 100) : Math.round(sellingPaise * 0.4);

    if (sellingPaise < 0 || basePaise < 0 || Number(stock_quantity) < 0) {
      return res.status(400).json({ success: false, error: 'Prices and stock cannot be negative.' });
    }

    const productId = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
    const sku = `CRF-${store.store_name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct: Product = {
      id: productId,
      seller_id: store.id,
      category_id,
      name,
      slug,
      sku,
      short_description,
      description: description || short_description,
      base_price: basePaise,
      selling_price: sellingPaise,
      cost_price: costPaise,
      stock_quantity: Math.max(0, parseInt(stock_quantity, 10)),
      low_stock_threshold: Math.max(0, parseInt(low_stock_threshold, 10)),
      material: material || 'Handmade mixed materials',
      color: color || 'Natural',
      dimensions,
      weight_grams: weight_grams ? parseInt(weight_grams, 10) : undefined,
      care_instructions: care_instructions || 'Store dry, avoid harsh chemicals.',
      handmade_technique: handmade_technique || 'Hand-assembled artisan craftsmanship',
      customization_available: Boolean(customization_available),
      processing_time_days: Math.max(1, parseInt(processing_time_days, 10) || 2),
      status: 'active', // Auto-active in demo, admin can moderate
      average_rating: 5.0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.products.unshift(newProduct);

    // Add initial product images
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((imgUrl: string, idx: number) => {
        db.product_images.push({
          id: crypto.randomUUID(),
          product_id: productId,
          image_url: imgUrl,
          alt_text: `${name} view ${idx + 1}`,
          is_primary: idx === 0,
          display_order: idx + 1,
        });
      });
    } else {
      // Default placeholder artisan image
      db.product_images.push({
        id: crypto.randomUUID(),
        product_id: productId,
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
        alt_text: name,
        is_primary: true,
        display_order: 1,
      });
    }

    // Log initial stock movement
    db.inventory_movements.push({
      id: crypto.randomUUID(),
      product_id: productId,
      quantity_change: newProduct.stock_quantity,
      movement_type: 'initial_stock',
      previous_stock: 0,
      new_stock: newProduct.stock_quantity,
      notes: 'Initial handcrafted stock listing',
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Handcrafted product listed successfully!',
      data: { product: db.getEnrichedProduct(newProduct) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/seller/products/:id - Edit Product
router.patch('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id) || db.seller_stores[0];

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }

  if (product.seller_id !== store.id && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Cannot edit products of another seller.' });
  }

  const {
    name,
    category_id,
    short_description,
    description,
    selling_price,
    base_price,
    stock_quantity,
    low_stock_threshold,
    material,
    color,
    status,
  } = req.body;

  if (name) product.name = name;
  if (category_id) product.category_id = category_id;
  if (short_description) product.short_description = short_description;
  if (description) product.description = description;
  if (selling_price !== undefined) product.selling_price = Math.round(Number(selling_price) * 100);
  if (base_price !== undefined) product.base_price = Math.round(Number(base_price) * 100);
  if (stock_quantity !== undefined) {
    const newStock = Math.max(0, parseInt(stock_quantity, 10));
    const diff = newStock - product.stock_quantity;
    if (diff !== 0) {
      db.inventory_movements.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        quantity_change: diff,
        movement_type: 'manual_adjustment',
        previous_stock: product.stock_quantity,
        new_stock: newStock,
        notes: 'Seller manual stock adjustment',
        created_at: new Date().toISOString(),
      });
      product.stock_quantity = newStock;
    }
  }
  if (low_stock_threshold !== undefined) product.low_stock_threshold = parseInt(low_stock_threshold, 10);
  if (material) product.material = material;
  if (color) product.color = color;
  if (status && ['active', 'draft', 'archived'].includes(status)) product.status = status;

  product.updated_at = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Product updated successfully.',
    data: { product: db.getEnrichedProduct(product) },
  });
});

// DELETE /api/seller/products/:id - Archive/Delete Product
router.delete('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id) || db.seller_stores[0];

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }

  if (product.seller_id !== store.id && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized.' });
  }

  // Soft archive to protect order history integrity
  product.status = 'archived';
  product.updated_at = new Date().toISOString();

  return res.json({ success: true, message: 'Product archived from active marketplace.' });
});

// GET /api/seller/orders - Orders containing this seller's products
router.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id) || db.seller_stores[0];

  const sellerOrders = db.seller_orders.filter((so) => so.seller_id === store.id);
  const enriched = sellerOrders.map((so) => {
    const parentOrder = db.orders.find((o) => o.id === so.order_id);
    return {
      ...so,
      order_number: parentOrder?.order_number,
      shipping_name: parentOrder?.shipping_name,
      shipping_city: parentOrder?.shipping_city,
      shipping_state: parentOrder?.shipping_state,
      created_at: parentOrder?.created_at,
      payment_method: parentOrder?.payment_method,
      payment_status: parentOrder?.payment_status,
    };
  });

  return res.json({ success: true, data: { orders: enriched } });
});

// PATCH /api/seller/orders/:sellerOrderId/fulfillment - Update Shipping Tracking
router.patch('/orders/:sellerOrderId/fulfillment', (req: AuthenticatedRequest, res: Response) => {
  const { sellerOrderId } = req.params;
  const { fulfillment_status, tracking_number, shipping_carrier } = req.body;

  const so = db.seller_orders.find((s) => s.id === sellerOrderId);
  if (!so) {
    return res.status(404).json({ success: false, error: 'Seller order not found.' });
  }

  if (fulfillment_status) {
    so.fulfillment_status = fulfillment_status;
    if (fulfillment_status === 'shipped') {
      so.shipped_at = new Date().toISOString();
    } else if (fulfillment_status === 'delivered') {
      so.delivered_at = new Date().toISOString();
    }
  }
  if (tracking_number) so.tracking_number = tracking_number;
  if (shipping_carrier) so.shipping_carrier = shipping_carrier;
  so.updated_at = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Fulfillment status updated!',
    data: { seller_order: so },
  });
});

// PATCH /api/seller/storefront - Update Store Profile
router.patch('/storefront', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const store = db.seller_stores.find((s) => s.user_id === user.id);
  if (!store) {
    return res.status(404).json({ success: false, error: 'Storefront not found.' });
  }

  const { store_name, tagline, story, city, state, logo_url, banner_url, instagram_handle } = req.body;
  if (store_name) store.store_name = store_name;
  if (tagline !== undefined) store.tagline = tagline;
  if (story !== undefined) store.story = story;
  if (city !== undefined) store.city = city;
  if (state !== undefined) store.state = state;
  if (logo_url !== undefined) store.logo_url = logo_url;
  if (banner_url !== undefined) store.banner_url = banner_url;
  if (instagram_handle !== undefined) store.instagram_handle = instagram_handle;

  store.updated_at = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Storefront updated successfully.',
    data: { store },
  });
});

export default router;
