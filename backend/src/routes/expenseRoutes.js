// src/routes/expenseRoutes.js
import express from 'express';
import {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getExpenseStats
} from '../controllers/expenseController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.post('/', verifyToken, addExpense);
router.get('/', verifyToken, getExpenses);
router.get('/stats', verifyToken, getExpenseStats);
router.put('/:id', verifyToken, updateExpense);
router.delete('/:id', verifyToken, deleteExpense);
export default router;
