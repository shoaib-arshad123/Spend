-- ============================================================
-- SpendSmart: Recurring Expenses & Savings Goals Tables
-- Run this in SSMS against your expense_tracker database
-- ============================================================

USE expense_tracker;
GO

-- ─── RECURRING EXPENSES TABLE ─────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'recurring_expenses')
BEGIN
  CREATE TABLE recurring_expenses (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, yearly
    startDate DATE NOT NULL,
    nextDueDate DATE NOT NULL,
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX idx_recurring_userId ON recurring_expenses(userId);
  CREATE INDEX idx_recurring_nextDue ON recurring_expenses(nextDueDate);
  PRINT '✅ recurring_expenses table created';
END
ELSE
  PRINT '⚠️ recurring_expenses table already exists';
GO

-- ─── SAVINGS GOALS TABLE ──────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'savings_goals')
BEGIN
  CREATE TABLE savings_goals (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    targetAmount DECIMAL(10, 2) NOT NULL,
    savedAmount DECIMAL(10, 2) DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Other', -- Emergency Fund, Travel, Gadgets, Education, Other
    icon NVARCHAR(50) DEFAULT N'🎯',
    deadline DATE NULL,
    isCompleted BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX idx_goals_userId ON savings_goals(userId);
  PRINT '✅ savings_goals table created';
END
ELSE
  PRINT '⚠️ savings_goals table already exists';
GO

PRINT '';
PRINT '🎉 All tables ready!';
