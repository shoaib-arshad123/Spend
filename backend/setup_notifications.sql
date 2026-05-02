-- ====================================================
-- Setup Permanent Notifications System for SpendSmart
-- Run this script in SQL Server Management Studio (SSMS)
-- ====================================================

USE expense_tracker;
GO

-- 1. Create Notifications Table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id INT PRIMARY KEY IDENTITY(1,1),
        userId INT NOT NULL,
        message NVARCHAR(500) NOT NULL,
        type NVARCHAR(50) DEFAULT 'info',
        title NVARCHAR(255) NULL,
        icon NVARCHAR(50) NULL,
        isRead BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    PRINT '✅ Table [notifications] created.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Table [notifications] already exists.';
END
GO

-- 2. Add 'title' column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'title')
BEGIN
    ALTER TABLE notifications ADD title NVARCHAR(255) NULL;
    PRINT '✅ Column [title] added to [notifications].';
END
GO

-- 3. Add 'icon' column if missing
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'icon')
BEGIN
    ALTER TABLE notifications ADD icon NVARCHAR(50) NULL;
    PRINT '✅ Column [icon] added to [notifications].';
END
GO

-- 4. Create Indexes for performance
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_notifications_userId')
BEGIN
    CREATE INDEX idx_notifications_userId ON notifications(userId);
    PRINT '✅ Index [idx_notifications_userId] created.';
END

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_notifications_isRead')
BEGIN
    CREATE INDEX idx_notifications_isRead ON notifications(isRead);
    PRINT '✅ Index [idx_notifications_isRead] created.';
END
GO

PRINT '🎉 Notification system database setup complete.';
GO
