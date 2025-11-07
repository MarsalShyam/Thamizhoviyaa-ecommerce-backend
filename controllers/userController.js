// backend/controllers/userController.js
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Product from '../models/Product.js';
import CartItem from '../models/CartItem.js';

// ====================== USER PROFILE ======================

// @desc    Get user profile (basic info and saved addresses)
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      addresses: user.addresses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile (Name, Email, Addresses)
// @route   PUT /api/users/profile
// @access  Private
// const updateProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);

//   if (user) {
//     user.name = req.body.name || user.name;
//     user.email = req.body.email || user.email;
//     user.phone = req.body.phone || user.phone;

//     if (req.body.password) {
//       user.password = req.body.password; // hashed by pre-save middleware
//     }

//     if (req.body.addresses) {
//       user.addresses = req.body.addresses;
//     }

//     const updatedUser = await user.save();

//     res.json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//       phone: updatedUser.phone,
//       isAdmin: updatedUser.isAdmin,
//       addresses: updatedUser.addresses,
//       message: 'Profile updated successfully',
//     });
//   } else {
//     res.status(404);
//     throw new Error('User not found');
//   }
// });
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // Destructure all potential update fields
  const { name, email, phone, password, profileImage, addresses } = req.body;

  if (user) {
    user.name = name !== undefined ? name : user.name;
    user.email = email !== undefined ? email : user.email;
    user.phone = phone !== undefined ? phone : user.phone;
    user.profileImage = profileImage !== undefined ? profileImage : user.profileImage; // Update profile image URL

    // Handle password update (requires hashing in pre-save middleware)
    if (password) {
      user.password = password;
    }

    // Handle full address array replacement (used by AddressManagement frontend)
    if (addresses) {
      user.addresses = addresses.map((addr) => ({
        ...addr,
        _id: addr._id ? addr._id : new mongoose.Types.ObjectId(),  // ✅ only if missing
      }));
    }

    const updatedUser = await user.save();

    // Return updated user data (excluding password)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
      addresses: updatedUser.addresses,
      profileImage: updatedUser.profileImage,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
// ====================== CART LOGIC ======================

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cartItems = await CartItem.find({ user: req.user._id }).populate(
    'product',
    'name price images size'
  );

  const cart = cartItems.map((item) => ({
    _id: item.product._id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0],
    quantity: item.quantity,
    size: item.size,
  }));

  res.json({ cart });
});

// @desc    Add or Update item in cart
// @route   POST /api/users/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const user = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let cartItem = await CartItem.findOne({ user, product: productId });

  if (cartItem) {
    cartItem.quantity += quantity;
    await cartItem.save();
  } else {
    cartItem = new CartItem({
      product: productId,
      user,
      name: product.name,
      image: product.images[0],
      price: product.price,
      quantity,
      size: product.size,
    });
    await cartItem.save();
  }

  const updatedCartItems = await CartItem.find({ user }).populate(
    'product',
    'name price images size'
  );

  const cart = updatedCartItems.map((item) => ({
    _id: item.product._id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0],
    quantity: item.quantity,
    size: item.size,
  }));

  res.json({ cart, message: 'Item added to cart successfully' });
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  await CartItem.deleteOne({ user: req.user._id, product: productId });

  const updatedCartItems = await CartItem.find({ user: req.user._id }).populate(
    'product',
    'name price images size'
  );

  const cart = updatedCartItems.map((item) => ({
    _id: item.product._id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0],
    quantity: item.quantity,
    size: item.size,
  }));

  res.json({ cart, message: 'Item removed from cart successfully' });
});

// @desc    Update item quantity in cart
// @route   PUT /api/users/cart/:productId
// @access  Private
const updateCartQuantity = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const { quantity } = req.body;

  const cartItem = await CartItem.findOne({
    user: req.user._id,
    product: productId,
  });

  if (!cartItem) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    await CartItem.deleteOne({ user: req.user._id, product: productId });
  } else {
    cartItem.quantity = quantity;
    await cartItem.save();
  }

  const updatedCartItems = await CartItem.find({ user: req.user._id }).populate(
    'product',
    'name price images size'
  );

  const cart = updatedCartItems.map((item) => ({
    _id: item.product._id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0],
    quantity: item.quantity,
    size: item.size,
  }));

  res.json({ cart, message: 'Cart quantity updated successfully' });
});

// ====================== WISHLIST LOGIC ======================

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('wishlist')
    .populate('wishlist');
  if (user) {
    res.json({ wishlist: user.wishlist });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add/Remove product from wishlist
// @route   POST or DELETE /api/users/wishlist/:productId
// @access  Private
const toggleWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const user = await User.findById(req.user._id);
  const product = await Product.findById(productId);

  if (!user || !product) {
    res.status(404);
    throw new Error('User or Product not found');
  }

  const index = user.wishlist.findIndex((item) => item.toString() === productId);

  if (index === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();
  await user.populate('wishlist');

  res.json({
    wishlist: user.wishlist,
    message: index === -1 ? 'Product added to wishlist' : 'Product removed from wishlist',
  });
});

// ====================== ADMIN FUNCTIONS ======================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete an administrator user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ====================== EXPORTS ======================
export {
  getProfile,
  updateProfile,
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getWishlist,
  toggleWishlist,
  getAllUsers,   // ✅ Admin
  deleteUser     // ✅ Admin
};
