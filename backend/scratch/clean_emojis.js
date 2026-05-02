
import { pool } from '../src/config/database.js';

async function clean() {
  try {
    console.log("Connecting to DB...");
    // The pool is usually already connected if imported from config, 
    // but in a script we might need to wait for it.
    
    // Using a direct query to clean up the '??' or emojis
    const query1 = "UPDATE expenses SET description = REPLACE(CAST(description AS NVARCHAR(MAX)), N'🎯 ', '') WHERE description LIKE N'🎯%'";
    const query2 = "UPDATE expenses SET description = REPLACE(CAST(description AS NVARCHAR(MAX)), N'💳 ', '') WHERE description LIKE N'💳%'";
    
    await pool.request().query(query1);
    await pool.request().query(query2);
    
    console.log("✅ Successfully cleaned emojis from history.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  } finally {
    process.exit(0);
  }
}

clean();
