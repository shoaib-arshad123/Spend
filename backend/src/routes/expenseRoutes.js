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
import { expenseValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();
router.post('/', verifyToken, expenseValidation, validateRequest, addExpense);
router.get('/', verifyToken, getExpenses);
router.get('/stats', verifyToken, getExpenseStats);
router.put('/:id', verifyToken, expenseValidation, validateRequest, updateExpense);
router.delete('/:id', verifyToken, deleteExpense);
export default router;
