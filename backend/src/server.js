// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import pool so the DB connection is established when the module loads
import { pool } from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';

import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4444;

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────
// Rate Limiting: Disabled for development, can be enabled later
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit for development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalsRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ success: true, message: 'Server is running' }));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
);

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
// pool.connect() is already called inside database.js; we wait for the pool
// to be ready before accepting HTTP traffic.
pool.on('connect', () => {
  // fires each time a new connection is added to the pool
});

// Give the pool 3 seconds to connect, then start regardless so
// the process doesn't hang if MSSQL is temporarily unavailable.
setTimeout(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log(`  │  🚀  SpendSmart API   http://localhost:${PORT}  │`);
    console.log('  │  📊  Database : MSSQL (pool)                │');
    console.log(`  │  🌐  CORS for : ${(process.env.FRONTEND_URL || 'http://localhost:5173').padEnd(28)}│`);
    console.log('  └─────────────────────────────────────────────┘');
    console.log('');
  });
}, 1500);
