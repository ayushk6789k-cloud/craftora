import dotenv from 'dotenv';
dotenv.config({ override: true });
import { createClient } from '@supabase/supabase-js';

const rawUrl = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://wkejjhrnkwnogkogexab.supabase.co'
).trim();

// Strip any trailing slash or erroneous /rest/v1 suffix
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_nPggHpU8Vo_JgTpzCI1QEw_GUUny_R1'
).trim();

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('[project-ref]') &&
  !supabaseKey.includes('your-key')
);

export const supabaseServerConfig = {
  url: supabaseUrl,
  hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  hasKey: Boolean(supabaseKey),
};

export const supabaseAdmin = isSupabaseServerConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
