import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { Coupon, MarketingCampaign } from '../types';

const router = Router();

// Restricted to Management & Admin
router.use(requireRole(['management', 'admin']));

// GET /api/management/analytics - Comprehensive business metrics
router.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  const completedOrders = db.orders.filter(
    (o) => o.payment_status === 'paid' || o.order_status === 'delivered'
  );

  const gmv = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const unitsSold = completedOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((isum, i) => isum + i.quantity, 0) || 0),
    0
  );
  const aov = completedOrders.length > 0 ? Math.round(gmv / completedOrders.length) : 0;

  // Marketplace commission vs Seller payout
  const totalCommission = db.seller_orders.reduce((sum, so) => sum + so.commission_amount, 0);
  const totalSellerPayouts = db.seller_orders.reduce((sum, so) => sum + so.seller_payout_amount, 0);

  // Revenue by Category
  const categoryMap = new Map<string, { name: string; revenue: number; units: number }>();
  for (const o of completedOrders) {
    if (o.items) {
      for (const it of o.items) {
        const prod = db.products.find((p) => p.id === it.product_id);
        const cat = db.categories.find((c) => c.id === prod?.category_id);
        const catName = cat?.name || 'Other Crafts';

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { name: catName, revenue: 0, units: 0 });
        }
        const entry = categoryMap.get(catName)!;
        entry.revenue += it.total_price;
        entry.units += it.quantity;
      }
    }
  }

  // Seller Performance
  const sellerPerformance = db.seller_stores.map((store) => {
    const orders = db.seller_orders.filter((so) => so.seller_id === store.id);
    const rev = orders.reduce((sum, so) => sum + so.subtotal, 0);
    return {
      id: store.id,
      store_name: store.store_name,
      city: store.city,
      totalOrders: orders.length,
      revenue: rev,
      commission_rate: store.commission_rate_percentage,
    };
  });

  return res.json({
    success: true,
    data: {
      summary: {
        gmv, // in paise
        completedOrdersCount: completedOrders.length,
        averageOrderValue: aov, // in paise
        unitsSold,
        totalMarketplaceCommission: totalCommission, // in paise
        totalSellerPayouts, // in paise
      },
      categoryBreakdown: Array.from(categoryMap.values()),
      sellerPerformance,
      recentOrders: completedOrders.slice(0, 5),
    },
  });
});

// GET /api/management/pricing-analysis
router.get('/pricing-analysis', (req: AuthenticatedRequest, res: Response) => {
  const analysis = db.products.map((p) => {
    const sellingPrice = p.selling_price;
    const costPrice = p.cost_price;
    const store = db.seller_stores.find((s) => s.id === p.seller_id);
    const commissionPercent = store?.commission_rate_percentage || 10;
    const marketplaceFee = Math.round((sellingPrice * commissionPercent) / 100);

    // Formula: Estimated Gross Profit = Selling Price - Product Cost - Applicable Variable Costs
    const grossProfit = Math.max(0, sellingPrice - costPrice - marketplaceFee);
    const grossMarginPercent =
      sellingPrice > 0 ? parseFloat(((grossProfit / sellingPrice) * 100).toFixed(1)) : 0;

    return {
      id: p.id,
      name: p.name,
      category_name: db.categories.find((c) => c.id === p.category_id)?.name,
      seller_name: store?.store_name,
      selling_price: sellingPrice,
      cost_price: costPrice,
      marketplace_fee: marketplaceFee,
      gross_profit: grossProfit,
      gross_margin_percent: grossMarginPercent,
      stock_quantity: p.stock_quantity,
    };
  });

  return res.json({
    success: true,
    data: { pricingAnalysis: analysis },
  });
});

// GET /api/management/campaigns
router.get('/campaigns', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: { campaigns: db.marketing_campaigns },
  });
});

// POST /api/management/campaigns - Create Campaign
router.post('/campaigns', (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    campaign_type,
    budget, // in rupees
    start_date,
    end_date,
    target_category_id,
    coupon_id,
    utm_source,
    utm_campaign,
  } = req.body;

  if (!name || !campaign_type || !start_date || !end_date) {
    return res.status(400).json({ success: false, error: 'Name, campaign type, and dates are required.' });
  }

  const campaign: MarketingCampaign = {
    id: crypto.randomUUID(),
    name,
    description: description || '',
    campaign_type,
    budget: Math.round(Number(budget || 0) * 100),
    start_date: new Date(start_date).toISOString(),
    end_date: new Date(end_date).toISOString(),
    target_category_id,
    coupon_id,
    status: 'active',
    utm_source: utm_source || 'campus',
    utm_campaign: utm_campaign || name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.marketing_campaigns.unshift(campaign);
  return res.status(201).json({ success: true, message: 'Campaign created.', data: { campaign } });
});

// GET /api/management/coupons
router.get('/coupons', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: { coupons: db.coupons },
  });
});

// POST /api/management/coupons - Create Coupon
router.post('/coupons', (req: AuthenticatedRequest, res: Response) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_value, // in rupees
    max_discount_amount, // in rupees
    usage_limit,
    expiry_days = 30,
  } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ success: false, error: 'Coupon code, type, and value are required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  if (db.coupons.some((c) => c.code === cleanCode)) {
    return res.status(409).json({ success: false, error: 'Coupon code already exists.' });
  }

  const isPercent = discount_type === 'percentage';
  const val = Number(discount_value);

  const newCoupon: Coupon = {
    id: crypto.randomUUID(),
    code: cleanCode,
    discount_type,
    discount_value: isPercent ? val : Math.round(val * 100),
    min_order_value: min_order_value ? Math.round(Number(min_order_value) * 100) : 0,
    max_discount_amount: max_discount_amount ? Math.round(Number(max_discount_amount) * 100) : undefined,
    usage_limit: usage_limit ? parseInt(usage_limit, 10) : 500,
    times_used: 0,
    per_customer_limit: 2,
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + parseInt(expiry_days, 10) * 86400000).toISOString(),
    is_active: true,
  };

  db.coupons.unshift(newCoupon);
  return res.status(201).json({ success: true, message: 'Coupon activated!', data: { coupon: newCoupon } });
});

export default router;
