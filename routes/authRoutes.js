// // backend/routes/authRoutes.js
// import express from 'express';
// import { registerUser, loginUser } from '../controllers/authController.js';

// const router = express.Router();

// // Public routes
// router.post('/register', registerUser);
// router.post('/login', loginUser);

// export default router;

// backend/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, resetPasswordByPhone } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Forgot password via phone + Firebase OTP
router.post('/reset-password-phone', resetPasswordByPhone);

export default router;
