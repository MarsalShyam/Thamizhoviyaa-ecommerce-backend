// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user + send email verification link
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password.');
  }

  // check duplicates (email or phone if provided)
  const query = [{ email }];
  if (phone) query.push({ phone });

  const existing = await User.findOne({ $or: query });

  if (existing) {
    res.status(400);
    throw new Error('User already exists with this email or phone.');
  }

  // generate email verification token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h

  const user = await User.create({
    name,
    email,
    phone,
    password,
    isVerified: false,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expires,
  });

  // send verification email (no need to block response)
  try {
    await sendVerificationEmail(user, rawToken);
  } catch (err) {
    console.error('Error sending verification email:', err.message);
  }

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

// @desc    Verify email using magic link token
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error('Verification token is required.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token.');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  res.json({ message: 'Email verified successfully. You can now log in.' });
});

// @desc    Login with email or phone + password
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { phoneOrEmail, password } = req.body;

  if (!phoneOrEmail || !password) {
    res.status(400);
    throw new Error('Please provide email/phone and password.');
  }

  const user = await User.findOne({
    $or: [{ email: phoneOrEmail }, { phone: phoneOrEmail }],
  });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email/phone or password');
  }

  // Block ONLY users that registered with email and are explicitly unverified
  if (user.email && user.isVerified === false) {
    res.status(403);
    throw new Error('Please verify your email before logging in.');
  }

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
    throw new Error('Invalid email/phone or password');
  }
});

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    // don't reveal whether email exists
    return res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, rawToken);
  } catch (err) {
    console.error('Error sending reset email:', err.message);
  }

  res.json({
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Please provide a new password.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token.');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
});

export { registerUser, verifyEmail, loginUser, forgotPassword, resetPassword };
