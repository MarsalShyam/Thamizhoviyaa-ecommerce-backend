// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, password, email } = req.body;

  // Check if user exists by phone or email
  const userExists = await User.findOne({ 
      $or: [{ phone }, { email: email ? email : undefined }]
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this phone or email.');
  }
  
  // Basic validation for phone number authentication
  if (!name || !phone || !password) {
      res.status(400);
      throw new Error('Please provide name, phone, and password.');
  }

  const user = await User.create({
    name,
    phone,
    email,
    password, // Handled by pre-save middleware in User model
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
      message: 'Registration successful. Welcome!'
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

export { registerUser, loginUser };