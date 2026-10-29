import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { SellerApplication } from '../types';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

/**
 * POST /api/auth/register
 * Fallback signup endpoint for when Supabase email rate limits or browser network policies block direct signUp.
 * Uses supabaseAdmin to register the user and immediately activate them in public.profiles.
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, full_name, phone, account_type, store_name, craft_type, bio } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required.',
      });
    }

    // Never allow public signup to choose admin or management roles
    const safeRole = account_type === 'seller' ? 'seller' : 'customer';

    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Supabase admin is not configured on the server.',
      });
    }

    // Create user in Supabase Auth via admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // auto-confirm to prevent rate limit blockage
      user_metadata: {
        full_name: full_name.trim(),
        phone: phone?.trim() || '',
        account_type: safeRole,
        store_name: store_name?.trim() || '',
        craft_type: craft_type?.trim() || '',
        bio: bio?.trim() || '',
      },
    });

    if (createError) {
      return res.status(400).json({
        success: false,
        error: createError.message,
      });
    }

    const newUser = userData.user;

    // Check that trigger populated public.profiles
    let profile = null;
    for (let i = 0; i < 3; i++) {
      const { data: p } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', newUser.id)
        .maybeSingle();
      if (p) {
        profile = p;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    return res.status(201).json({
      success: true,
      message: 'Account created and verified successfully.',
      data: {
        userId: newUser.id,
        email: newUser.email,
        profile,
      },
    });
  } catch (err: any) {
    console.error('Server signup error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server signup failed.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile and seller store (if artisan).
 * Strictly requires valid Supabase token verified in authMiddleware.
 */
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: req.authError || 'Not authenticated. Please log in.',
    });
  }

  const sellerStore = db.seller_stores.find((s) => s.user_id === req.user?.id) || null;
  const { password_hash: _, ...safeUser } = req.user;

  return res.json({
    success: true,
    data: {
      user: safeUser,
      sellerStore,
    },
  });
});

/**
 * POST /api/auth/sync-profile
 * Called after Supabase client-side authentication to ensure the profile is registered
 * in the database store and any artisan application metadata is recorded.
 */
router.post('/sync-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { store_name, craft_type, department, bio, experience_years } = req.body;

    // Check if user requested an artisan application and doesn't have one pending
    if (store_name && craft_type) {
      const existingApp = db.seller_applications.find(
        (a) => a.user_id === user.id && a.status === 'pending'
      );
      if (!existingApp) {
        const application: SellerApplication = {
          id: crypto.randomUUID(),
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          store_name,
          craft_type,
          department: department || 'FD',
          bio: bio || 'Artisan maker application via registration.',
          experience_years: Number(experience_years) || 1,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        db.seller_applications.push(application);
      }
    }

    const sellerStore = db.seller_stores.find((s) => s.user_id === user.id) || null;
    const { password_hash: _, ...safeUser } = user;

    return res.json({
      success: true,
      data: {
        user: safeUser,
        sellerStore,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/auth/profile
 * Updates permitted user profile fields (full_name, phone, bio, avatar_url).
 * Prevents unauthorized role or ID modification.
 */
router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, phone, bio, avatar_url } = req.body;
    const user = req.user!;

    // Strictly update permitted fields only
    if (full_name && typeof full_name === 'string') user.full_name = full_name.trim();
    if (phone !== undefined) user.phone = typeof phone === 'string' ? phone.trim() : '';
    if (bio !== undefined) user.bio = typeof bio === 'string' ? bio.trim() : '';
    if (avatar_url !== undefined) user.avatar_url = typeof avatar_url === 'string' ? avatar_url.trim() : '';
    user.updated_at = new Date().toISOString();

    db.upsertProfile(user);

    // Sync to Supabase public.profiles if connected
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: user.full_name,
            phone: user.phone,
            bio: user.bio,
            avatar_url: user.avatar_url,
            updated_at: user.updated_at,
          })
          .eq('id', user.id);
      } catch (dbErr) {
        // Non-blocking if profiles table not synced
      }
    }

    const { password_hash: _, ...safeUser } = user;
    return res.json({ success: true, data: { user: safeUser } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/apply-seller
 * Submits an artisan application for review.
 * Does NOT immediately grant seller privileges.
 */
router.post('/apply-seller', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { store_name, craft_type, department, bio, experience_years } = req.body;
    if (!store_name || !craft_type || !bio) {
      return res.status(400).json({
        success: false,
        error: 'Store name, craft type, and bio are required for seller application.',
      });
    }

    const existingApp = db.seller_applications.find(
      (a) => a.user_id === req.user!.id && a.status === 'pending'
    );
    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending seller application under review.',
      });
    }

    const application: SellerApplication = {
      id: crypto.randomUUID(),
      user_id: req.user!.id,
      user_name: req.user!.full_name,
      user_email: req.user!.email,
      store_name,
      craft_type,
      department: department || 'FD',
      bio,
      experience_years: Number(experience_years) || 1,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    db.seller_applications.push(application);

    // Sync to Supabase seller_applications if connected
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('seller_applications').insert({
          id: application.id,
          user_id: application.user_id,
          store_name: application.store_name,
          craft_type: application.craft_type,
          department: application.department,
          bio: application.bio,
          experience_years: application.experience_years,
          status: 'pending',
        });
      } catch (dbErr) {
        // Non-blocking
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully! An administrator will review it shortly.',
      data: { application },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
