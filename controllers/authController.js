// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import User from '../models/User.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/notificationService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, password, email } = req.body;

  // Check if user exists by phone or email (only if email provided)
  const query = [{ phone }];
  if (email) query.push({ email });

  const userExists = await User.findOne({ $or: query });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this phone or email.');
  }

  if (!name || !phone || !password) {
    res.status(400);
    throw new Error('Please provide name, phone, and password.');
  }

  const user = await User.create({
    name,
    phone,
    email,
    password,
  });

  if (user) {
    // 🔔 Send welcome email (if email present)
    sendWelcomeEmail(user); // no await to avoid slowing response

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      message: 'Registration successful. Welcome!',
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { phoneOrEmail, password } = req.body;

  if (!phoneOrEmail || !password) {
    res.status(400);
    throw new Error('Please provide phone/email and password.');
  }

  const user = await User.findOne({
    $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
  });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid phone/email or password');
  }
});

// @desc    Forgot password - send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { phoneOrEmail } = req.body;

  if (!phoneOrEmail) {
    res.status(400);
    throw new Error('Please provide your phone or email.');
  }

  const user = await User.findOne({
    $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail }],
  });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this phone or email.');
  }

  if (!user.email) {
    res.status(400);
    throw new Error('This account has no email. Please contact support.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

  await sendPasswordResetEmail(user, resetUrl);

  res.json({
    message: 'Password reset link sent to your email (valid for 1 hour).',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) {
    res.status(400);
    throw new Error('Please provide a new password.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token.');
  }

  user.password = password; // will be hashed by pre-save middleware
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can log in now.' });
});

export { registerUser, loginUser, forgotPassword, resetPassword };
