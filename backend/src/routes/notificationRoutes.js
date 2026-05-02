import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getNotifications, createNotification, markRead, clearNotifications, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.post('/', verifyToken, createNotification);
router.put('/mark-read', verifyToken, markRead);
router.delete('/', verifyToken, clearNotifications);
router.delete('/:id', verifyToken, deleteNotification);

export default router;
