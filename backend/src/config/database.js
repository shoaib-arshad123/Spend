// src/config/database.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'expense_tracker',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  options: {
    encrypt: false, // Set to false for Somee compatibility
    trustServerCertificate: true, 
    enableKeepAlive: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export const pool = new sql.ConnectionPool(config);

pool.connect()
  .then(() => console.log('✅ DATABASE: Connected'))
  .catch(err => console.error('❌ DATABASE: Connection failed', err));
