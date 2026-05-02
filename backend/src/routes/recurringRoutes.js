import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getRecurring, createRecurring, updateRecurring, deleteRecurring, processDueRecurring } from '../controllers/recurringController.js';

const router = express.Router();

router.get('/', verifyToken, getRecurring);
router.post('/', verifyToken, createRecurring);
router.post('/process', verifyToken, processDueRecurring);
router.put('/:id', verifyToken, updateRecurring);
router.delete('/:id', verifyToken, deleteRecurring);

export default router;
