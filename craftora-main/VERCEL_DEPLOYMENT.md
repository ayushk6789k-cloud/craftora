# Deploying Craftora on Vercel

Craftora is configured with:
1. **Frontend**: Vite + React 19 SPA (built into `/dist`)
2. **Backend**: Express API routes mounted under `/api/*` and routed via Vercel Serverless Function (`api/index.ts`)
3. **Database**: Supabase PostgreSQL with real cart persistence, order records, receipts, and user auth

---

## Quick Deployment Steps

### Option 1: Deploy with Vercel CLI
If you have Vercel CLI installed locally:
```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy to preview or production
npx vercel --prod
```

### Option 2: Deploy via GitHub / GitLab / Bitbucket
1. Push this repository to GitHub or your Git provider.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In the project settings, configure the **Environment Variables** (see table below).
4. Click **Deploy**. Vercel will automatically run `npm run build` and provision the serverless API routes.

---

## Required Environment Variables in Vercel

Add these under **Project Settings > Environment Variables** in your Vercel Dashboard:

| Variable Name | Description | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase Project URL for Frontend | `https://wkejjhrnkwnogkogexab.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Anon/Publishable Key | `sb_publishable_nPggHpU8Vo_JgTpzCI1QEw_GUUny_R1` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Publishable Key | `sb_publishable_nPggHpU8Vo_JgTpzCI1QEw_GUUny_R1` |
| `SUPABASE_URL` | Supabase Project URL for API | `https://wkejjhrnkwnogkogexab.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon Key for API fallback | `sb_publishable_nPggHpU8Vo_JgTpzCI1QEw_GUUny_R1` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | *(Your secret service role key from Supabase Dashboard > Settings > API)* |

---

## How It Works on Vercel
- **`vercel.json`**:
  - Directs any `/api/*` request to `/api/index.ts` (Vercel Serverless Function running your Express router).
  - Directs all other requests to `/index.html` for single-page client routing.
- **`api/index.ts`**: Runs the complete Express API without needing a dedicated persistent Node VPS.
- **Supabase**: Automatically handles real persistent carts (`carts`, `cart_items`), orders & receipts (`orders`, `order_items`), payments, and user accounts.
