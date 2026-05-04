import { pool } from './src/config/database.js';

async function setup() {
  try {
    await pool.connect();
    console.log('Checking for badges column...');

    // Check if column exists
    const check = await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('users') AND     name = 'badges'
      )
      BEGIN
        ALTER TABLE users ADD badges NVARCHAR(MAX) DEFAULT '[]';
        PRINT 'Added badges column';
      END
      ELSE
      BEGIN
        PRINT 'badges column already exists';
      END
    `);

    console.log('Database setup complete');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setup();
