import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin, isSupabaseServerConfigured } from '../lib/supabase';

const router = Router();

// Helper to get or create cart in Supabase database & local memory
async function getOrCreateCart(userId?: string, sessionId?: string): Promise<{ id: string; user_id?: string; session_id?: string }> {
  // 1. Check database if Supabase configured
  if (isSupabaseServerConfigured && supabaseAdmin) {
    try {
      if (userId) {
        const { data: dbUserCart } = await supabaseAdmin
          .from('carts')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (dbUserCart) {
          return dbUserCart;
        }

        const newCartId = crypto.randomUUID();
        const { data: createdCart } = await supabaseAdmin
          .from('carts')
          .insert({
            id: newCartId,
            user_id: userId,
            session_id: sessionId || null,
          })
          .select()
          .single();

        if (createdCart) return createdCart;
      } else if (sessionId) {
        const { data: dbSessCart } = await supabaseAdmin
          .from('carts')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (dbSessCart) {
          return dbSessCart;
        }

        const newCartId = crypto.randomUUID();
        const { data: createdCart } = await supabaseAdmin
          .from('carts')
          .insert({
            id: newCartId,
            session_id: sessionId,
          })
          .select()
          .single();

        if (createdCart) return createdCart;
      }
    } catch (err) {
      console.warn('Database cart resolution fallback:', err);
    }
  }

  // 2. In-memory fallback
  let cart = db.carts.find(
    (c) => (userId && c.user_id === userId) || (sessionId && c.session_id === sessionId)
  );

  if (!cart) {
    cart = {
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId || (!userId ? crypto.randomUUID() : undefined),
    };
    db.carts.push(cart);
  } else if (userId && !cart.user_id) {
    cart.user_id = userId;
  }

  return cart;
}

// GET /api/cart
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    const userId = req.user?.id;

    const cart = await getOrCreateCart(userId, sessionId);

    let items: any[] = [];

    // Query Supabase database first
    if (isSupabaseServerConfigured && supabaseAdmin && cart.id) {
      try {
        const { data: dbItems, error: itemsErr } = await supabaseAdmin
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id);

        if (!itemsErr && Array.isArray(dbItems)) {
          items = dbItems;
        }
      } catch (err) {
        console.warn('Error fetching db cart items:', err);
      }
    }

    // If database returned empty or offline, fallback to memory
    if (items.length === 0) {
      items = db.cart_items.filter((ci) => ci.cart_id === cart.id);
    }

    let subtotal = 0;
    const enrichedItems = items.map((item) => {
      const rawProduct = db.products.find((p) => p.id === item.product_id);
      const product = rawProduct ? db.getEnrichedProduct(rawProduct) : undefined;
      const price = product ? product.selling_price : 0;
      const total = price * item.quantity;
      subtotal += total;

      return {
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        product,
        unit_price: price,
        total_price: total,
        is_available: product ? product.stock_quantity >= item.quantity : false,
      };
    });

    return res.json({
      success: true,
      data: {
        cart_id: cart.id,
        session_id: cart.session_id,
        items: enrichedItems,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal, // in paise
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cart/items - Add to cart
router.post('/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const sessionId = req.headers['x-session-id'] as string;
    const userId = req.user?.id;

    if (!product_id) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const product = db.products.find((p) => p.id === product_id && p.status === 'active');
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found or is inactive.' });
    }

    const cart = await getOrCreateCart(userId, sessionId);

    // 1. Check in Supabase database
    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        const { data: existingDbItem } = await supabaseAdmin
          .from('cart_items')
          .select('*')
          .eq('cart_id', cart.id)
          .eq('product_id', product_id)
          .maybeSingle();

        const targetQty = existingDbItem ? existingDbItem.quantity + qty : qty;
        if (targetQty > product.stock_quantity) {
          return res.status(400).json({
            success: false,
            error: `Only ${product.stock_quantity} units available in artisan inventory.`,
          });
        }

        if (existingDbItem) {
          await supabaseAdmin
            .from('cart_items')
            .update({ quantity: targetQty })
            .eq('id', existingDbItem.id);
        } else {
          await supabaseAdmin.from('cart_items').insert({
            id: crypto.randomUUID(),
            cart_id: cart.id,
            product_id,
            quantity: qty,
          });
        }
      } catch (dbErr) {
        console.warn('Database cart insert error, updating local store:', dbErr);
      }
    }

    // 2. Also sync in-memory cache
    const existing = db.cart_items.find((ci) => ci.cart_id === cart.id && ci.product_id === product_id);
    const targetQty = existing ? existing.quantity + qty : qty;
    if (existing) {
      existing.quantity = targetQty;
    } else {
      db.cart_items.push({
        id: crypto.randomUUID(),
        cart_id: cart.id,
        product_id,
        quantity: qty,
      });
    }

    return res.json({
      success: true,
      message: `${product.name} added to cart!`,
      data: { cart_id: cart.id },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/cart/items/:id - Update quantity
router.patch('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    // Sync database
    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        if (qty <= 0) {
          await supabaseAdmin.from('cart_items').delete().eq('id', id);
        } else {
          await supabaseAdmin.from('cart_items').update({ quantity: qty }).eq('id', id);
        }
      } catch (e) {
        console.warn('Error updating db cart item:', e);
      }
    }

    // Sync memory
    const item = db.cart_items.find((ci) => ci.id === id);
    if (item) {
      if (qty <= 0) {
        db.cart_items = db.cart_items.filter((ci) => ci.id !== id);
      } else {
        item.quantity = qty;
      }
    }

    return res.json({ success: true, message: qty <= 0 ? 'Item removed from cart.' : 'Quantity updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/items/:id - Remove item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseServerConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('cart_items').delete().eq('id', id);
      } catch (e) {
        console.warn('Error deleting db cart item:', e);
      }
    }

    db.cart_items = db.cart_items.filter((ci) => ci.id !== id);
    return res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cart/merge - Merge guest cart to user cart
router.post('/merge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { session_id } = req.body;

    if (!userId || !session_id) {
      return res.json({ success: true, message: 'No merge needed.' });
    }

    const guestCart = await getOrCreateCart(undefined, session_id);
    const userCart = await getOrCreateCart(userId);

    if (isSupabaseServerConfigured && supabaseAdmin && guestCart.id && userCart.id) {
      try {
        const { data: gItems } = await supabaseAdmin
          .from('cart_items')
          .select('*')
          .eq('cart_id', guestCart.id);

        if (gItems && gItems.length > 0) {
          for (const item of gItems) {
            const { data: existingUserItem } = await supabaseAdmin
              .from('cart_items')
              .select('*')
              .eq('cart_id', userCart.id)
              .eq('product_id', item.product_id)
              .maybeSingle();

            if (existingUserItem) {
              await supabaseAdmin
                .from('cart_items')
                .update({ quantity: existingUserItem.quantity + item.quantity })
                .eq('id', existingUserItem.id);
            } else {
              await supabaseAdmin.from('cart_items').insert({
                cart_id: userCart.id,
                product_id: item.product_id,
                quantity: item.quantity,
              });
            }
          }
          // Clear guest cart
          await supabaseAdmin.from('cart_items').delete().eq('cart_id', guestCart.id);
        }
      } catch (e) {
        console.warn('Merge database cart error:', e);
      }
    }

    return res.json({ success: true, message: 'Carts merged successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
