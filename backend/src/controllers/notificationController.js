import { getPool } from '../config/database.js';

export const getNotifications = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', req.userId)
      .query('SELECT * FROM notifications WHERE userId = @userId ORDER BY createdAt DESC');
      
    // Format notifications for the frontend
    const formatted = result.recordset.map(n => ({
      id: n.id,
      title: n.title || (n.type === 'danger' ? 'Budget Alert' : n.type === 'warning' ? 'Budget Warning' : 'Update'),
      message: n.message,
      type: n.type || 'info',
      icon: n.icon || (n.type === 'danger' ? '🚨' : n.type === 'warning' ? '⚠️' : '💡'),
      time: n.createdAt,
      isRead: n.isRead === 1 || n.isRead === true
    }));

    res.json({ success: true, notifications: formatted });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createNotification = async (req, res) => {
  try {
    const pool = await getPool();
    const { message, type, title, icon } = req.body;
    
    if (!message) {
      console.error('Create notification failed: Message is required');
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const request = pool.request()
      .input('userId', req.userId)
      .input('message', message)
      .input('type', type || 'info')
      .input('title', title || '')
      .input('icon', icon || '');

    const query = `
      INSERT INTO notifications (userId, message, type, isRead, title, icon, createdAt)
      OUTPUT INSERTED.*
      VALUES (@userId, @message, @type, 0, @title, @icon, GETDATE())
    `;

    const result = await request.query(query);
    console.log(`✅ Notification created for user ${req.userId}: ${title || message}`);
    
    const n = result.recordset[0];
    const formatted = {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      icon: n.icon,
      time: n.createdAt,
      isRead: n.isRead === 1 || n.isRead === true
    };
      
    res.json({ success: true, notification: formatted });
  } catch (error) {
    console.error('CREATE NOTIFICATION ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error during notification creation' });
  }
};

export const markRead = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', req.userId)
      .query('UPDATE notifications SET isRead = 1 WHERE userId = @userId');

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', req.userId)
      .query('DELETE FROM notifications WHERE userId = @userId');

    res.json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    await pool.request()
      .input('id', id)
      .input('userId', req.userId)
      .query('DELETE FROM notifications WHERE id = @id AND userId = @userId');

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
