
import { pool } from '../src/config/database.js';

async function migrate() {
  try {
    console.log("Connecting to database...");
    await pool.connect();
    console.log("🚀 Starting database migration to NVARCHAR for Unicode support...");
    
    const queries = [
      // Categories
      "ALTER TABLE categories ALTER COLUMN name NVARCHAR(100)",
      "ALTER TABLE categories ALTER COLUMN icon NVARCHAR(100)",
      
      // Expenses
      "ALTER TABLE expenses ALTER COLUMN category NVARCHAR(100)",
      "ALTER TABLE expenses ALTER COLUMN description NVARCHAR(MAX)",
      
      // Notifications
      "ALTER TABLE notifications ALTER COLUMN message NVARCHAR(500)",
      "ALTER TABLE notifications ALTER COLUMN type NVARCHAR(50)",
      "ALTER TABLE notifications ALTER COLUMN title NVARCHAR(255)",
      "ALTER TABLE notifications ALTER COLUMN icon NVARCHAR(50)",
      
      // Goals
      "ALTER TABLE goals ALTER COLUMN name NVARCHAR(255)",
      "ALTER TABLE goals ALTER COLUMN category NVARCHAR(100)",
      
      // Recurring Expenses
      "ALTER TABLE recurring_expenses ALTER COLUMN category NVARCHAR(100)",
      "ALTER TABLE recurring_expenses ALTER COLUMN description NVARCHAR(MAX)",
      "ALTER TABLE recurring_expenses ALTER COLUMN frequency NVARCHAR(50)"
    ];

    for (const q of queries) {
      try {
        console.log(`Running: ${q}...`);
        await pool.request().query(q);
        console.log("✅ Success");
      } catch (err) {
        console.warn(`⚠️ Skipped/Failed: ${q}. Error: ${err.message}`);
      }
    }

    console.log("🎉 Migration process finished.");
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
