-- SQL Server Schema for Expense Tracker
-- Create Database
CREATE DATABASE expense_tracker;
GO

USE expense_tracker;
GO

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  budget DECIMAL(10, 2) DEFAULT 0,
  language VARCHAR(20) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'dark',
  avatar NVARCHAR(50) DEFAULT N'🧑‍💻',
  photo NVARCHAR(MAX) NULL,
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE()
);

CREATE INDEX idx_users_email ON users(email);
GO

-- Categories Table
CREATE TABLE categories (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100),
  isCustom BIT DEFAULT 0,
  createdAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_userId ON categories(userId);
-- Filtered unique index to prevent duplicate user categories while allowing multiple default categories
CREATE UNIQUE INDEX UQ_categories_userId_name ON categories(userId, name) WHERE userId IS NOT NULL;
GO

-- Expenses Table
CREATE TABLE expenses (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  date DATE NOT NULL,
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_expenses_userId ON expenses(userId);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_userId_date ON expenses(userId, date);
GO

-- Budgets Table
CREATE TABLE budgets (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  createdAt DATETIME DEFAULT GETDATE(),
  updatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (userId, month, year)
);

CREATE INDEX idx_budgets_userId ON budgets(userId);
GO

-- Notifications Table
CREATE TABLE notifications (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  message VARCHAR(500),
  type VARCHAR(50),
  title VARCHAR(255),
  icon VARCHAR(50),
  isRead BIT DEFAULT 0,
  createdAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_userId ON notifications(userId);
CREATE INDEX idx_notifications_isRead ON notifications(isRead);
GO

-- Rewards Table
CREATE TABLE rewards (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  points INT DEFAULT 0,
  description VARCHAR(255),
  createdAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_rewards_userId ON rewards(userId);
GO

-- Insert Default Categories
INSERT INTO categories (userId, name, icon, isCustom) VALUES
(NULL, 'Food & Dining', '🍔', 0),
(NULL, 'Transportation', '🚗', 0),
(NULL, 'Entertainment', '🎬', 0),
(NULL, 'Shopping', '🛍️', 0),
(NULL, 'Bills & Utilities', '💡', 0),
(NULL, 'Health & Fitness', '⚕️', 0),
(NULL, 'Education', '📚', 0),
(NULL, 'Travel', '✈️', 0),
(NULL, 'Other', '📌', 0);
GO

-- Recurring Expenses Table
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

CREATE INDEX idx_recurring_userId ON recurring_expenses(userId);
CREATE INDEX idx_recurring_nextDue ON recurring_expenses(nextDueDate);
GO

-- Savings Goals Table
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

CREATE INDEX idx_goals_userId ON savings_goals(userId);
GO
