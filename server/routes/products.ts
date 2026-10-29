import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { Product } from '../types';

const router = Router();

// GET /api/products - Search, Filter, Sort, Paginate
router.get('/', (req, res) => {
  try {
    const {
      category,
      search,
      min_price,
      max_price,
      material,
      seller_id,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    let items = db.products.filter((p) => p.status === 'active');

    // Category filter
    if (category) {
      const cat = db.categories.find((c) => c.slug === category || c.id === category);
      if (cat) {
        items = items.filter((p) => p.category_id === cat.id);
      }
    }

    // Seller filter
    if (seller_id) {
      items = items.filter((p) => p.seller_id === seller_id);
    }

    // Search filter
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          (p.handmade_technique && p.handmade_technique.toLowerCase().includes(q))
      );
    }

    // Price filter (prices in paise)
    if (min_price) {
      const minPaise = Number(min_price) * 100;
      items = items.filter((p) => p.selling_price >= minPaise);
    }
    if (max_price) {
      const maxPaise = Number(max_price) * 100;
      items = items.filter((p) => p.selling_price <= maxPaise);
    }

    // Material filter
    if (material && typeof material === 'string') {
      items = items.filter((p) => p.material.toLowerCase().includes(material.toLowerCase()));
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case 'price_desc':
        items.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case 'rating':
        items.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'popular':
        items.sort((a, b) => b.review_count - a.review_count);
        break;
      case 'newest':
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    // Pagination
    const totalCount = items.length;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    const enriched = db.getEnrichedProducts(paginatedItems);

    return res.json({
      success: true,
      data: {
        products: enriched,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:slugOrId - Single Product Details
router.get('/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const product = db.products.find(
    (p) => p.id === slugOrId || p.slug === slugOrId
  );

  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const enriched = db.getEnrichedProduct(product);
  const reviews = db.reviews.filter((r) => r.product_id === product.id && r.is_approved);

  return res.json({
    success: true,
    data: {
      product: enriched,
      reviews,
    },
  });
});

// POST /api/products/:id/reviews - Submit review
router.post('/:id/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const user = req.user!;

    const product = db.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5 stars.' });
    }
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Review comment must be at least 5 characters.' });
    }

    // Check verified purchase
    const hasPurchased = db.orders.some(
      (ord) =>
        ord.user_id === user.id &&
        (ord.order_status === 'delivered' || ord.payment_status === 'paid') &&
        ord.items?.some((item) => item.product_id === product.id)
    );

    // Prevent duplicate review
    const existingReview = db.reviews.find((r) => r.product_id === product.id && r.user_id === user.id);
    if (existingReview) {
      return res.status(409).json({ success: false, error: 'You have already submitted a review for this handcrafted item.' });
    }

    const review = {
      id: crypto.randomUUID(),
      product_id: product.id,
      user_id: user.id,
      order_id: 'ord-verified',
      user_name: user.full_name,
      rating: ratingNum,
      title: title || 'Verified Purchase Review',
      comment: comment.trim(),
      is_verified_purchase: hasPurchased,
      is_approved: true,
      created_at: new Date().toISOString(),
    };

    db.reviews.push(review);

    // Recompute product rating
    const prodReviews = db.reviews.filter((r) => r.product_id === product.id && r.is_approved);
    const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    product.average_rating = parseFloat(avg.toFixed(1));
    product.review_count = prodReviews.length;

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
      data: { review },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
