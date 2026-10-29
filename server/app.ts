import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authMiddleware } from './middleware/auth';
import { checkDatabaseConnection } from './db/supabaseService';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import cartRouter from './routes/cart';
import wishlistRouter from './routes/wishlist';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import sellerRouter from './routes/seller';
import managementRouter from './routes/management';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';

export function createExpressApp() {
  const app = express();

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

  return app;
}

export default createExpressApp;
