import { Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { UserProfile, UserRole } from '../types';
import { supabaseAdmin, isSupabaseServerConfigured } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  authError?: string;
}

/**
 * Validates Supabase Access Token on incoming requests.
 * Zero-trust: Never trusts client-supplied headers, demo IDs, or unsigned tokens.
 * Complies with Requirement 1, 11, 12, and 19.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  if (!isSupabaseServerConfigured || !supabaseAdmin) {
    req.authError = 'Supabase authentication service is not configured on the server. Please provide valid SUPABASE_URL and key.';
    return next();
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      req.authError = error?.message || 'Invalid, expired, or unrecognized Supabase session token.';
      return next();
    }

    const authUser = data.user;

    // Read user's profile directly from public.profiles (Requirement 5 & 11)
    // No in-memory fallback is used
    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileErr) {
      req.authError = `Failed to retrieve profile from public.profiles: ${profileErr.message}`;
      return next();
    }

    if (!profileRow) {
      // Zero in-memory fallback (Requirement 11)
      req.authError = 'Profile record not found in public.profiles. Access denied.';
      return next();
    }

    req.user = {
      id: profileRow.id,
      email: profileRow.email || authUser.email || '',
      full_name: profileRow.full_name || '',
      phone: profileRow.phone || undefined,
      avatar_url: profileRow.avatar_url || undefined,
      role: profileRow.role,
      bio: profileRow.bio || undefined,
      created_at: profileRow.created_at || authUser.created_at,
      updated_at: profileRow.updated_at || new Date().toISOString(),
    };

    return next();
  } catch (err: any) {
    req.authError = err.message || 'Authentication token validation error.';
    return next();
  }
}

/**
 * Route guard enforcing authentication.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: req.authError || 'Authentication required. Please log in with your Craftora account.',
      code: 'UNAUTHORIZED',
    });
  }
  next();
}

/**
 * Route guard enforcing strict Role-Based Access Control (RBAC).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: req.authError || 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. This portal requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is: '${req.user.role}'.`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
