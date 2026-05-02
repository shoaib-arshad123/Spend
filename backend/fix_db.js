
import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  connectionString: `server=${process.env.DB_SERVER || 'localhost'}\\${process.env.DB_INSTANCE || 'SQLEXPRESS'};Database=${process.env.DB_NAME || 'expense_tracker'};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`
};

async function fix() {
  console.log('🚀 Starting Database Fix...');
  console.log('Config:', config.connectionString);
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to MSSQL');

    // 1. Create recurring_expenses if missing
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'recurring_expenses')
      BEGIN
        CREATE TABLE recurring_expenses (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId INT NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description NVARCHAR(500),
          frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
          startDate DATE NOT NULL,
          nextDueDate DATE NOT NULL,
          isActive BIT DEFAULT 1,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        PRINT 'Table recurring_expenses created';
      END
    `);

    // 2. Create savings_goals if missing
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'savings_goals')
      BEGIN
        CREATE TABLE savings_goals (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId INT NOT NULL,
          name NVARCHAR(255) NOT NULL,
          targetAmount DECIMAL(10, 2) NOT NULL,
          savedAmount DECIMAL(10, 2) DEFAULT 0,
          category VARCHAR(100) DEFAULT 'Other',
          icon NVARCHAR(50) DEFAULT N'🎯',
          deadline DATE NULL,
          isCompleted BIT DEFAULT 0,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        PRINT 'Table savings_goals created';
      END
    `);

    // 3. Check for notifications table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
      BEGIN
        CREATE TABLE notifications (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId INT NOT NULL,
          message NVARCHAR(MAX),
          type VARCHAR(50),
          title VARCHAR(255),
          icon VARCHAR(50),
          isRead BIT DEFAULT 0,
          createdAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        PRINT 'Table notifications created';
      END
    `);

    // 4. Check for rewards table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rewards')
      BEGIN
        CREATE TABLE rewards (
          id INT PRIMARY KEY IDENTITY(1,1),
          userId INT NOT NULL,
          points INT DEFAULT 0,
          description VARCHAR(255),
          createdAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        PRINT 'Table rewards created';
      END
    `);

    console.log('✨ All tables verified/created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Fix Failed:', err.message);
    process.exit(1);
  }
}

fix();
