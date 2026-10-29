# Craftora - Setup, Configuration & Deployment Guide

## 1. Quick Start (Development Mode)
Craftora features a unified full-stack architecture that runs seamlessly on port 3000.

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Run Locally
```bash
npm install
npm run dev
```
The application will start on `http://localhost:3000`.

---

## 2. Supabase PostgreSQL Configuration

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> Database**, locate your Connection URI (e.g. `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`).

### Step 2: Execute Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy and execute the contents of:
   `supabase/migrations/20250101000000_initial_marketplace_schema.sql`
3. Then execute the seed data from:
   `supabase/seed.sql`

### Step 3: Configure Storage Buckets
1. In Supabase, go to **Storage** and create a public bucket named `products`.
2. Configure RLS or set public read access for product photos.

---

## 3. Razorpay Test Mode Setup

1. Create a free account at [https://razorpay.com](https://razorpay.com).
2. Switch to **Test Mode** in the dashboard banner.
3. Navigate to **Settings -> API Keys** and generate:
   - `RAZORPAY_KEY_ID` (starts with `rzp_test_...`)
   - `RAZORPAY_KEY_SECRET`
4. Add these into `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretHere
   ```
5. In **Settings -> Webhooks**, add your webhook endpoint:
   `https://your-domain.com/api/webhooks/razorpay`
   Select events: `order.paid`, `payment.failed`.

---

## 4. Environment Variables Overview

**Craftora requires zero mandatory environment variables to run.** The application ships ready for immediate execution in Academic Demo Mode:

| Variable | Scope | Required? | Purpose & Behavior |
|---|---|---|---|
| `PORT` | Server | No (Default 3000) | Bound automatically to 3000 as required by Cloud Run / AI Studio reverse proxy. |
| `NODE_ENV` | Server | No (Default dev) | Managed automatically by Node.js and Vite (`development` or `production`). |
| `JWT_SECRET` | Server | No | Optional key for signing Express session tokens. Defaults to a built-in fallback key. |
| `DATABASE_URL` | Server | No | Not used by runtime. The app uses the resilient in-memory store (`server/db/store.ts`). |
| `SUPABASE_URL` | Server | Optional | Optional Supabase project URL (e.g. `https://grixqtjyajwrnrahkbyp.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Optional | Optional admin secret for server-side Supabase operations. **Never expose to browser.** |
| `PAYMENT_MODE` | Server | No (Default `demo`) | When `demo`, Razorpay is completely bypassed and academic simulation checkout is enabled. |
| `RAZORPAY_KEY_ID` | Server | Optional | Only used if `PAYMENT_MODE=razorpay` and PAN verification is completed. |
| `RAZORPAY_KEY_SECRET` | Server | Optional | Only used if `PAYMENT_MODE=razorpay`. |
| `VITE_API_BASE_URL` | Client | No (Default `/api`) | Relative `/api` endpoint path for same-origin backend communication. |

---

## 5. Production Build & Deployment

```bash
npm run build
npm start
```
- The Vite frontend compiles into static assets inside `dist/`.
- The Express backend bundles into a self-contained `dist/server.cjs` via `esbuild`.
- Run `node dist/server.cjs` in production containers.
