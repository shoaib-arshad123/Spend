-- ====================================================
-- Schema Update: Add avatar & photo columns to users
-- Run this in SSMS against your expense_tracker DB
-- ====================================================

USE expense_tracker;
GO

-- Add avatar column (emoji avatar like 🧑‍💻)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'avatar')
BEGIN
  ALTER TABLE users ADD avatar NVARCHAR(50) DEFAULT N'🧑‍💻';
END
GO

-- Add photo column (stores base64 encoded profile picture)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'photo')
BEGIN
  ALTER TABLE users ADD photo NVARCHAR(MAX) NULL;
END
GO

PRINT 'Schema update complete: avatar and photo columns added to users table.';
GO

-- ====================================================
-- Schema Update: Add title & icon to notifications
-- ====================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'title')
BEGIN
  ALTER TABLE notifications ADD title NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'icon')
BEGIN
  ALTER TABLE notifications ADD icon NVARCHAR(50) NULL;
END
GO

PRINT 'Schema update complete: title and icon columns added to notifications table.';
GO
