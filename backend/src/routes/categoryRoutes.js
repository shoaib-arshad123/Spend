// src/routes/categoryRoutes.js
import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, createCategory);
export default router;
