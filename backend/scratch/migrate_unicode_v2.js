
import { pool } from '../src/config/database.js';

async function migrate() {
  try {
    console.log("Connecting to database...");
    await pool.connect();
    console.log("🚀 Finishing database migration...");
    
    const queries = [
      // Savings Goals
      "ALTER TABLE savings_goals ALTER COLUMN name NVARCHAR(255)",
      "ALTER TABLE savings_goals ALTER COLUMN category NVARCHAR(100)",
      
      // Also check if recurring_expenses columns need more care
      "ALTER TABLE recurring_expenses ALTER COLUMN category NVARCHAR(100)",
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
