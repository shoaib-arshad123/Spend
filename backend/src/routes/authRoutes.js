// src/routes/authRoutes.js
import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { authValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();
router.post('/register', authValidation.register, validateRequest, register);
router.post('/login', authValidation.login, validateRequest, login);
router.get('/me', verifyToken, getCurrentUser);
export default router;
