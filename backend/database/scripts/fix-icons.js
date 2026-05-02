import { pool } from './src/config/database.js';

async function fix() {
  try {
    await pool.connect();
    
    console.log("Altering columns to NVARCHAR...");
    // We must drop indexes first if any depend on these columns, but let's try direct alter first.
    // Wait, UQ_categories_userId_name depends on 'name'. 
    // We can just drop it, alter, and recreate it.
    await pool.request().query(`
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_categories_userId_name')
      BEGIN
        DROP INDEX UQ_categories_userId_name ON categories;
      END
      
      IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_categories_default_name')
      BEGIN
        DROP INDEX UQ_categories_default_name ON categories;
      END
      
      ALTER TABLE categories ALTER COLUMN name NVARCHAR(100) NOT NULL;
      ALTER TABLE categories ALTER COLUMN icon NVARCHAR(100);
      ALTER TABLE expenses ALTER COLUMN category NVARCHAR(100);
      
      CREATE UNIQUE INDEX UQ_categories_userId_name ON categories(userId, name) WHERE userId IS NOT NULL;
    `);
    
    console.log("Updating default categories with unicode emojis...");
    await pool.request().query(`
      UPDATE categories SET icon = N'🍔' WHERE name = 'Food & Dining' OR name = 'Food';
      UPDATE categories SET icon = N'🚗' WHERE name = 'Transportation' OR name = 'Transport';
      UPDATE categories SET icon = N'🎬' WHERE name = 'Entertainment';
      UPDATE categories SET icon = N'🛍️' WHERE name = 'Shopping';
      UPDATE categories SET icon = N'💡' WHERE name = 'Bills & Utilities';
      UPDATE categories SET icon = N'⚕️' WHERE name = 'Health & Fitness';
      UPDATE categories SET icon = N'📚' WHERE name = 'Education';
      UPDATE categories SET icon = N'✈️' WHERE name = 'Travel';
      UPDATE categories SET icon = N'📌' WHERE name = 'Other';
    `);

    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
fix();
