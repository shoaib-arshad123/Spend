// src/config/database.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbServer   = process.env.DB_SERVER || 'localhost';
const dbUser     = process.env.DB_USER?.trim()     || '';
const dbPassword = process.env.DB_PASSWORD?.trim() || '';

// Windows Authentication: no DB_USER / DB_PASSWORD set in .env
// SQL Server Authentication: DB_USER and DB_PASSWORD both set
const useWindowsAuth = !dbUser && !dbPassword;

console.log(`[DB] Server: ${dbServer} | Auth: ${useWindowsAuth ? 'Windows (Trusted)' : 'SQL Server'}`);

// Build config conditionally so we never pass user/password when using Windows Auth
const config = {
  server:  dbServer,
  database: process.env.DB_NAME || 'expense_tracker',
  port:    process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  connectionTimeout: 30000,
  requestTimeout:    30000,
  options: {
    encrypt:                process.env.DB_ENCRYPT === 'true',   // true for Azure SQL
    trustServerCertificate: true,
    enableKeepAlive:        true,
    // Windows Auth — only works when running on Windows with the right AD user
    trustedConnection: useWindowsAuth,
  },
  pool: {
    max:                10,
    min:                0,
    idleTimeoutMillis:  30000,
    acquireTimeoutMillis: 30000,
  }
};

// Only add credentials when using SQL Server Auth
if (!useWindowsAuth) {
  config.user     = dbUser;
  config.password = dbPassword;
}

// ── Connection pool with auto-reconnect ──────────────────────────────────────
let _pool          = null;
let _connectPromise = null;

/**
 * Returns a live, connected ConnectionPool.
 * Automatically reconnects if the pool was closed or errored.
 * Every controller calls `const pool = await getPool()` per request.
 */
export async function getPool() {
  // Already connected — fast path
  if (_pool && _pool.connected) return _pool;

  // Another call is already reconnecting — wait for it
  if (_connectPromise) return _connectPromise;

  // Need to (re)connect
  _connectPromise = (async () => {
    if (_pool) {
      try { await _pool.close(); } catch (_) { /* ignore */ }
      _pool = null;
    }

    const newPool = new sql.ConnectionPool(config);

    newPool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      _pool          = null;
      _connectPromise = null;
    });

    await newPool.connect();
    console.log('✅ DATABASE: Connected');
    _pool          = newPool;
    _connectPromise = null;
    return _pool;
  })();

  try {
    return await _connectPromise;
  } catch (err) {
    _connectPromise = null;
    _pool          = null;
    console.error('❌ DATABASE: Connection failed —', err.message);
    throw err;
  }
}

// Eager connect on startup (non-fatal — retries on first request if it fails)
getPool().catch(err =>
  console.warn('[DB] Startup connection failed, will retry on first request:', err.message)
);
