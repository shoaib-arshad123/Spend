import { pool } from './src/config/database.js';

console.log('Testing database connection...');

pool.connect()
  .then(async () => {
    console.log('✅ Connected successfully');
    try {
      const result = await pool.request().query('SELECT TOP 1 * FROM users');
      console.log('✅ Query successful:', result.recordset);
    } catch (err) {
      console.error('❌ Query failed:', err.message);
    } finally {
      await pool.close();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
