import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

import { authMiddleware } from './server/middleware/auth';
import { checkDatabaseConnection } from './server/db/supabaseService';
import authRouter from './server/routes/auth';
import productsRouter from './server/routes/products';
import categoriesRouter from './server/routes/categories';
import cartRouter from './server/routes/cart';
import wishlistRouter from './server/routes/wishlist';
import ordersRouter from './server/routes/orders';
import paymentsRouter from './server/routes/payments';
import sellerRouter from './server/routes/seller';
import managementRouter from './server/routes/management';
import adminRouter from './server/routes/admin';
import uploadRouter from './server/routes/upload';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), brand: 'Craftora' });
  });

  app.get('/api/database/status', async (req, res) => {
    const status = await checkDatabaseConnection();
    res.json({ success: true, data: status });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/wishlist', wishlistRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/seller', sellerRouter);
  app.use('/api/management', managementRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/upload', uploadRouter);

  // Central error handler for /api/*
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  // Vite middleware for development vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Craftora Marketplace Server running on port ${PORT}`);
  });
}

startServer();
