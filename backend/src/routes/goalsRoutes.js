import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getGoals, createGoal, addSavings, updateGoal, deleteGoal } from '../controllers/goalsController.js';

const router = express.Router();

router.get('/', verifyToken, getGoals);
router.post('/', verifyToken, createGoal);
router.put('/:id', verifyToken, updateGoal);
router.put('/:id/savings', verifyToken, addSavings);
router.delete('/:id', verifyToken, deleteGoal);

export default router;
