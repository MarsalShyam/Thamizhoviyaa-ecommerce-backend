// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

//forget / Reset password
router.post('/forget-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;