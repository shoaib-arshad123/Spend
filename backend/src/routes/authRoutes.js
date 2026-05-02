import express from 'express';
import { register, login, getCurrentUser, sendOTP, verifyOTP, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { authValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();
router.post('/register', authValidation.register, validateRequest, register);
router.post('/login', authValidation.login, validateRequest, login);
router.get('/me', verifyToken, getCurrentUser);

// Verification & Security
router.post('/send-otp', verifyToken, sendOTP);
router.post('/verify-otp', verifyToken, verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyToken, changePassword);

export default router;
