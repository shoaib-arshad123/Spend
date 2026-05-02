// src/routes/budgetRoutes.js
import express from 'express';
import { setBudget, getBudget, getBudgetHistory } from '../controllers/budgetController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.post('/', verifyToken, setBudget);
router.get('/', verifyToken, getBudget);
router.get('/history', verifyToken, getBudgetHistory);
export default router;
