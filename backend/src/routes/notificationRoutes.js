import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', verifyToken, (req, res) => {
  res.json({ success: true, notifications: [] });
});

// Mark a notification as read
router.put('/:id', verifyToken, (req, res) => {
  res.json({ success: true, message: `Notification ${req.params.id} updated` });
});

export default router;
