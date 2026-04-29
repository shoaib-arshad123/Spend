// src/routes/budgetRoutes.js
import express from 'express';
import { setBudget, getBudget } from '../controllers/budgetController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.post('/', verifyToken, setBudget);
router.get('/', verifyToken, getBudget);
export default router;
