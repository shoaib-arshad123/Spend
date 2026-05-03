import { pool } from './src/config/database.js';

async function migrate() {
  try {
    console.log('Migrating database...');
    await pool.connect();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'isHidden')
      BEGIN
        ALTER TABLE expenses ADD isHidden BIT DEFAULT 0;
      END
    `);
    console.log('✅ Column isHidden added successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
