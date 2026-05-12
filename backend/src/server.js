// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import getPool so the DB connection is established when the module loads
import { getPool } from './config/database.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4444;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the frontend — supports multiple origins for local + prod
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:4173',   // Vite preview
  'http://localhost:3000',   // Alternative local port
  process.env.FRONTEND_URL,  // Set this in your deployment env vars
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow all origins
    if (!IS_PROD) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 500 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (!IS_PROD) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalsRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  success: true,
  message: 'Server is running',
  env: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

// ─── SERVE FRONTEND IN PRODUCTION ─────────────────────────────────────────────
// When deployed as a single service (backend serves the built frontend too),
// uncomment the block below and set SERVE_FRONTEND=true in your env.
// This is optional — skip if your frontend is deployed separately (Vercel/Netlify).
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendDist = path.join(__dirname, '../../dist');
  app.use(express.static(frontendDist));
  // All non-API routes serve the React app (client-side routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

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
setTimeout(() => {
  app.listen(PORT, () => {
    if (!IS_PROD) {
      console.log('');
      console.log('  ┌─────────────────────────────────────────────┐');
      console.log(`  │  🚀  SpendSmart API   http://localhost:${PORT}  │`);
      console.log('  │  📊  Database : MSSQL (pool)                │');
      console.log(`  │  🌐  CORS for : ${(process.env.FRONTEND_URL || 'http://localhost:5173').padEnd(28)}│`);
      console.log('  └─────────────────────────────────────────────┘');
      console.log('');
    } else {
      console.log(`✅ SpendSmart API running on port ${PORT} [production]`);
    }
  });
}, 1500);
