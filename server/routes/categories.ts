import { Router } from 'express';
import { db } from '../db/store';

const router = Router();

// GET /api/categories - All active categories with product counts
router.get('/', (req, res) => {
  const categoriesWithCounts = db.categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map((c) => {
      const productCount = db.products.filter(
        (p) => p.category_id === c.id && p.status === 'active'
      ).length;
      return {
        ...c,
        productCount,
      };
    });

  return res.json({
    success: true,
    data: { categories: categoriesWithCounts },
  });
});

// GET /api/categories/:slug - Single category with products
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const category = db.categories.find((c) => c.slug === slug || c.id === slug);

  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }

  const products = db.getEnrichedProducts(
    db.products.filter((p) => p.category_id === category.id && p.status === 'active')
  );

  return res.json({
    success: true,
    data: {
      category,
      products,
    },
  });
});

export default router;
