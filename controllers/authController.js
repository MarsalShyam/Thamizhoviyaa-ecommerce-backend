// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import admin from '../config/firebaseAdmin.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper: normalize phone to digits only
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/[^\d]/g, '');
};

// @desc    Register a new user (phone verified by Firebase OTP)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, password, email, firebaseIdToken } = req.body;

  // ✅ Require OTP verification via Firebase
  if (!firebaseIdToken) {
    res.status(400);
    throw new Error('Phone verification required. Please verify via OTP.');
  }

  if (!name || !phone || !password) {
    res.status(400);
    throw new Error('Please provide name, phone, and password.');
  }

  // Verify Firebase ID token and match phone
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
  } catch (err) {
    console.error('Firebase token verify error:', err.message);
    res.status(400);
    throw new Error('Invalid Firebase token. Please re-verify OTP.');
  }

  const firebasePhone = normalizePhone(decodedToken.phone_number);
  const requestPhone = normalizePhone(phone);

  if (!firebasePhone || !firebasePhone.endsWith(requestPhone)) {
    res.status(400);
    throw new Error('Phone number mismatch. Please verify the correct phone via OTP.');
  }

  // Check if user exists by phone or email
  const query = [{ phone }];
  if (email) query.push({ email });

  const userExists = await User.findOne({ $or: query });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this phone or email.');
  }

  const user = await User.create({
    name,
    phone,
    email,
    password, // handled by pre-save middleware
  });

  if (user) {
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

  // Find user by phone or email
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

// @desc    Reset password via phone (Firebase OTP required)
// @route   POST /api/auth/reset-password-phone
// @access  Public
const resetPasswordByPhone = asyncHandler(async (req, res) => {
  const { phone, password, firebaseIdToken } = req.body;

  if (!phone || !password || !firebaseIdToken) {
    res.status(400);
    throw new Error('Phone, new password, and Firebase token are required.');
  }

  // Verify Firebase token
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
  } catch (err) {
    console.error('Firebase token verify error (reset):', err.message);
    res.status(400);
    throw new Error('Invalid Firebase token. Please re-verify OTP.');
  }

  const firebasePhone = normalizePhone(decodedToken.phone_number);
  const requestPhone = normalizePhone(phone);

  if (!firebasePhone || !firebasePhone.endsWith(requestPhone)) {
    res.status(400);
    throw new Error('Phone number mismatch. Please verify the correct phone via OTP.');
  }

  // Find user by phone
  const user = await User.findOne({ phone });

  if (!user) {
    res.status(404);
    throw new Error('No user found with this phone number.');
  }

  // Update password (will be hashed by pre-save)
  user.password = password;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
});

export { registerUser, loginUser, resetPasswordByPhone };
