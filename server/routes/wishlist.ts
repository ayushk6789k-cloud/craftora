import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/wishlist
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const items = db.wishlists.filter((w) => w.user_id === userId);

  const enriched = items.map((w) => {
    const rawProd = db.products.find((p) => p.id === w.product_id);
    return {
      ...w,
      product: rawProd ? db.getEnrichedProduct(rawProd) : undefined,
    };
  });

  return res.json({ success: true, data: { wishlist: enriched } });
});

// POST /api/wishlist - Add product
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ success: false, error: 'Product ID required' });
  }

  const existing = db.wishlists.find((w) => w.user_id === userId && w.product_id === product_id);
  if (existing) {
    return res.json({ success: true, message: 'Item already in wishlist' });
  }

  const newItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    product_id,
    created_at: new Date().toISOString(),
  };

  db.wishlists.push(newItem);
  return res.status(201).json({ success: true, message: 'Added to your wishlist!', data: { item: newItem } });
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.params;

  db.wishlists = db.wishlists.filter((w) => !(w.user_id === userId && w.product_id === productId));
  return res.json({ success: true, message: 'Removed from wishlist' });
});

export default router;
