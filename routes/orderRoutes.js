// import express from 'express';
// const router = express.Router();
// import { 
//   createRazorpayOrder, 
//   verifyRazorpayPayment, 
//   addOrderItems, 
//   getMyOrders, 
//   getOrderById,
//   getAllOrders,
//   updateOrderToDelivered 
// } from '../controllers/orderController.js';

// import { protect, admin } from '../middleware/authMiddleware.js';

// // ====================== RAZORPAY ROUTES ======================
// router.post('/razorpay/create-order', protect, createRazorpayOrder);
// router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// // ====================== USER ROUTES ======================
// router.post('/', protect, addOrderItems);
// router.get('/myorders', protect, getMyOrders);
// router.get('/:id', protect, getOrderById);

// // ====================== ADMIN ROUTES ======================
// router.get('/', protect, admin, getAllOrders);
// router.put('/:id/deliver', protect, admin, updateOrderToDelivered);

// export default router;


// backend/routes/orderRoutes.js
import express from 'express';
const router = express.Router();

import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  addOrderItems,
  getMyOrders,
  getOrderById,        // included (NEW + OLD)
  getAllOrders,
  updateOrderStatus,   // included (NEW + OLD)
  updateOrderToDelivered,
} from '../controllers/orderController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

// Razorpay
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// Create order and Admin get all
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getAllOrders);

// Get my orders
router.get('/myorders', protect, getMyOrders);

// Get single order (user or admin)
router.route('/:id').get(protect, getOrderById);

// Admin: update order status (Ordered | Packed | Shipped | Delivered)
router.route('/:id/status').put(protect, admin, updateOrderStatus);

// Admin: mark delivered (legacy/compat)
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;

