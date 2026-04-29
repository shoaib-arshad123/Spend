// src/config/database.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: process.env.DB_USER ? 'default' : 'ntlm',
    options: {
      userName: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      domain: process.env.DB_DOMAIN || ''
    }
  },
  options: {
    // If you specify an instance name, the driver will ignore the port.
    // For a plain TCP/IP connection you can omit `instanceName`.
    instanceName: process.env.DB_INSTANCE || undefined,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME || 'expense_tracker',
    encrypt: false,                // disable TLS for local dev
    trustServerCertificate: true, // needed when encrypt = false
    integratedSecurity: process.env.DB_USER ? false : true,
    enableKeepAlive: true
  }
};

export const pool = new sql.ConnectionPool(config);

pool.connect()
  .then(() => console.log('✅ DATABASE: Connected'))
  .catch(err => console.error('❌ DATABASE: Connection failed', err));
