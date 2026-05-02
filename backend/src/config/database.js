// src/config/database.js
import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';

dotenv.config();

const isWindowsAuth = !process.env.DB_USER;

const config = isWindowsAuth
  ? {
      connectionString: `server=${process.env.DB_SERVER || 'localhost'}\\${process.env.DB_INSTANCE || 'SQLEXPRESS'};Database=${process.env.DB_NAME || 'expense_tracker'};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`
    }
  : {
      server: process.env.DB_SERVER || 'localhost',
      authentication: {
        type: 'default',
        options: {
          userName: process.env.DB_USER || '',
          password: process.env.DB_PASSWORD || ''
        }
      },
      options: {
        instanceName: process.env.DB_INSTANCE || undefined,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        database: process.env.DB_NAME || 'expense_tracker',
        encrypt: false,
        trustServerCertificate: true,
        enableKeepAlive: true
      }
    };

export const pool = new sql.ConnectionPool(config);

pool.connect()
  .then(() => console.log('✅ DATABASE: Connected'))
  .catch(err => console.error('❌ DATABASE: Connection failed', err));
