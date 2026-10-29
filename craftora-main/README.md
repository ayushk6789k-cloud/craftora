# Craftora - Handcrafted Accessories Marketplace

A full-stack, production-ready multi-vendor handcrafted accessories marketplace connecting independent artisans with conscious buyers. Features real-time cart persistence, verified user authentication, order receipts, catalog browsing, and multi-tier account workflows.

---

## 🌟 Key Features

- **Genuine Supabase Authentication**: Real user sign-in and registration powered by Supabase Auth (`supabase.auth.signUp` & `supabase.auth.signInWithPassword`) with profile triggers in PostgreSQL.
- **Persistent Cart & Orders**: Cart items, address details, orders, and payment records are saved directly to Supabase PostgreSQL with transaction integrity.
- **Artisan Storefronts**: Dedicated artisan profile pages showcasing creator stories, verification badges, and studio collections.
- **Product Catalog & Filters**: Full filtering by craft discipline, material, price range, and stock availability.
- **Responsive & Polished UI**: Built with Tailwind CSS, custom Playfair Display typography, high-definition photography with fallback handling, and mobile-ready drawers.
- **Vercel & Cloud Ready**: Configured for Vercel Serverless Functions (`/api/*` via `@vercel/node`) and standalone Express server.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/craftora.git
cd craftora
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-publishable-key>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-publishable-key>

SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-optional-for-admin>
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🚢 Deploy to GitHub & Vercel

### Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Craftora Handcrafted Accessories Marketplace"
git branch -M main
git remote add origin https://github.com/<your-username>/craftora.git
git push -u origin main
```

### Deploy on Vercel:
1. Import the repository in [vercel.com/new](https://vercel.com/new).
2. Under **Project Settings > Environment Variables**, add the keys from `.env.example`.
3. Deploy! The `vercel.json` rewrites automatically route `/api/*` to the serverless function in `api/index.ts`.
