// backend/routes/userRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
  getProfile, 
  updateProfile,
  getCart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity,
  getWishlist,
  toggleWishlist,
  getAllUsers,     // ✅ Admin route import
  deleteUser       // ✅ Admin route import
} from '../controllers/userController.js';

const router = express.Router();

// ====================== ADMIN ROUTES ======================
// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.route('/')
  .get(protect, admin, getAllUsers);

// @route   DELETE /api/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.route('/:id')
  .delete(protect, admin, deleteUser);

// ====================== USER ROUTES ======================
// @route   GET/PUT /api/users/profile
// @desc    Get or update user profile
// @access  Private
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

// ====================== CART ROUTES ======================
// @route   GET/POST /api/users/cart
// @desc    Get cart / Add or update item
// @access  Private
router.route('/cart')
  .get(protect, getCart)
  .post(protect, addToCart);

// @route   DELETE/PUT /api/users/cart/:productId
// @desc    Remove item / Update quantity
// @access  Private
router.route('/cart/:productId')
  .delete(protect, removeFromCart)
  .put(protect, updateCartQuantity);

// ====================== WISHLIST ROUTES ======================
// @route   GET /api/users/wishlist
// @desc    Get wishlist
// @access  Private
router.route('/wishlist')
  .get(protect, getWishlist);

// @route   POST/DELETE /api/users/wishlist/:productId
// @desc    Toggle wishlist (add/remove)
// @access  Private
router.route('/wishlist/:productId')
  .post(protect, toggleWishlist)
  .delete(protect, toggleWishlist);

export default router;
