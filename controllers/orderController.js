// import dotenv from 'dotenv';
// dotenv.config();

// import asyncHandler from 'express-async-handler';
// import Order from '../models/Order.js';
// import CartItem from '../models/CartItem.js';
// import Razorpay from 'razorpay';
// import crypto from 'crypto';

// // ====================== RAZORPAY INITIALIZATION ======================
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // ====================== RAZORPAY LOGIC ======================

// // @desc    Create Razorpay Order (Pre-payment step)
// // @route   POST /api/orders/razorpay/create-order
// // @access  Private
// const createRazorpayOrder = asyncHandler(async (req, res) => {
//   const { totalPrice } = req.body;

//   const amountInPaisa = Math.round(totalPrice * 100); // INR → paisa
//   const options = {
//     amount: amountInPaisa,
//     currency: 'INR',
//     receipt: crypto.randomBytes(10).toString('hex'),
//   };

//   razorpay.orders.create(options, (err, order) => {
//     if (err) {
//       console.error(err);
//       res.status(500);
//       throw new Error('Razorpay failed to create order.');
//     }
//     res.json({ id: order.id, currency: order.currency, amount: order.amount });
//   });
// });

// // @desc    Verify Razorpay Payment Signature
// // @route   POST /api/orders/razorpay/verify
// // @access  Private
// const verifyRazorpayPayment = asyncHandler(async (req, res) => {
//   const { order_id, payment_id, signature } = req.body;

//   const body = order_id + "|" + payment_id;

//   const expectedSignature = crypto
//     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//     .update(body.toString())
//     .digest('hex');

//   if (expectedSignature === signature) {
//     res.json({ success: true, message: 'Payment verified successfully.' });
//   } else {
//     res.status(400);
//     throw new Error('Payment signature verification failed.');
//   }
// });

// // ====================== ORDER CREATION ======================

// // @desc    Create new order in DB (after payment verification)
// // @route   POST /api/orders
// // @access  Private
// const addOrderItems = asyncHandler(async (req, res) => {
//   const { 
//     orderItems, 
//     shippingAddress, 
//     paymentMethod, 
//     paymentResult, 
//     taxPrice, 
//     shippingPrice, 
//     totalPrice 
//   } = req.body;

//   if (!orderItems || orderItems.length === 0) {
//     res.status(400);
//     throw new Error('No order items');
//   }

//   const order = new Order({
//     user: req.user._id,
//     orderItems,
//     shippingAddress,
//     paymentMethod,
//     paymentResult: paymentResult || { id: 'COD_ORDER', status: 'Pending' },
//     taxPrice,
//     shippingPrice,
//     totalPrice,
//     isPaid: paymentMethod === 'Razorpay' ? true : false,
//     paidAt: paymentMethod === 'Razorpay' ? Date.now() : null,
//   });

//   const createdOrder = await order.save();

//   // Clear user's cart after successful order
//   await CartItem.deleteMany({ user: req.user._id });

//   res.status(201).json(createdOrder);
// });

// // ====================== USER ROUTES ======================

// // @desc    Get logged-in user's all orders
// // @route   GET /api/orders/myorders
// // @access  Private
// const getMyOrders = asyncHandler(async (req, res) => {
//   const orders = await Order.find({ user: req.user._id });
//   res.json(orders);
// });

// // @desc    Get single order by ID
// // @route   GET /api/orders/:id
// // @access  Private
// const getOrderById = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id).populate('user', 'name email');

//   if (order) {
//     if (order.user._id.toString() === req.user._id.toString() || req.user.isAdmin) {
//       res.json(order);
//     } else {
//       res.status(401);
//       throw new Error('Not authorized to view this order');
//     }
//   } else {
//     res.status(404);
//     throw new Error('Order not found');
//   }
// });

// // ====================== ADMIN ROUTES ======================

// // @desc    Get all orders (Admin)
// // @route   GET /api/orders
// // @access  Private/Admin
// const getAllOrders = asyncHandler(async (req, res) => {
//   const orders = await Order.find({}).populate('user', 'id name email');
//   res.json(orders);
// });

// // @desc    Update order to delivered
// // @route   PUT /api/orders/:id/deliver
// // @access  Private/Admin
// const updateOrderToDelivered = asyncHandler(async (req, res) => {
//   const order = await Order.findById(req.params.id);

//   if (order) {
//     order.isDelivered = true;
//     order.deliveredAt = Date.now();
//     const updatedOrder = await order.save();
//     res.json(updatedOrder);
//   } else {
//     res.status(404);
//     throw new Error('Order not found');
//   }
// });

// // ====================== EXPORTS ======================
// export { 
//   createRazorpayOrder, 
//   verifyRazorpayPayment, 
//   addOrderItems, 
//   getMyOrders,
//   getOrderById,
//   getAllOrders,
//   updateOrderToDelivered 
// };

// backend/controllers/orderController.js
import dotenv from 'dotenv';
dotenv.config();

import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// ================== RAZORPAY INITIALIZATION ==================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================== CREATE RAZORPAY ORDER ==================
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { totalPrice } = req.body;
  const amountInPaisa = Math.round(totalPrice * 100);
  const options = {
    amount: amountInPaisa,
    currency: 'INR',
    receipt: crypto.randomBytes(10).toString('hex'),
  };

  razorpay.orders.create(options, (err, order) => {
    if (err) {
      console.error(err);
      res.status(500);
      throw new Error('Razorpay failed to create order.');
    }
    res.json({ id: order.id, currency: order.currency, amount: order.amount });
  });
});

// ================== VERIFY RAZORPAY PAYMENT ==================
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const body = order_id + '|' + payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === signature) {
    res.json({ success: true, message: 'Payment verified successfully.' });
  } else {
    res.status(400);
    throw new Error('Payment signature verification failed.');
  }
});

// ================== ADD ORDER AFTER PAYMENT ==================
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult,
    taxPrice,
    shippingPrice,
    totalPrice,
    itemsPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult: paymentResult || { id: 'COD_ORDER', status: 'Pending' },
    itemsPrice: itemsPrice || 0,
    taxPrice: taxPrice || 0,
    shippingPrice: shippingPrice || 0,
    totalPrice: totalPrice || 0,
    isPaid: paymentMethod === 'Razorpay' ? true : false,
    paidAt: paymentMethod === 'Razorpay' ? Date.now() : null,

    // ✅ Default Order Status
    status: 'Ordered',
    statusHistory: [
      { status: 'Ordered', updatedBy: req.user._id, timestamp: Date.now() },
    ],
  });

  const createdOrder = await order.save();

  // remove purchased items from cart (only those products)
  if (orderItems && orderItems.length > 0) {
    const purchasedProductIds = orderItems.map(it => it.product.toString());
    // delete each cart item that matches user & product
    await CartItem.deleteMany({
      user: req.user._id,
      product: { $in: purchasedProductIds },
    });
  }


  res.status(201).json(createdOrder);
});

// ================== GET MY ORDERS (USER) ==================
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// ================== GET ORDER BY ID ==================
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (order) {
    // Allow only the owner or an admin
    if (req.user.isAdmin || order.user._id.toString() === req.user._id.toString()) {
      res.json(order);
    } else {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ================== ADMIN: GET ALL ORDERS ==================
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// ================== ADMIN: UPDATE ORDER STATUS ==================
// Expected body: { status: 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled', note?: 'optional' }
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const allowedStatuses = ['Pending', 'Ordered', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // ✅ Handle delivery flags
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else {
    order.isDelivered = false;
    order.deliveredAt = null;
  }

  // ✅ Update main status and push history
  order.status = status;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status,
    note: note || '',
    updatedBy: req.user._id,
    timestamp: Date.now(),
  });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// ================== ADMIN: MARK ORDER AS DELIVERED ==================
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.isDelivered) {
    res.status(400);
    throw new Error('Order is already delivered');
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.status = 'Delivered';

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'Delivered',
    note: 'Marked delivered by admin.',
    updatedBy: req.user._id,
    timestamp: Date.now(),
  });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// ================== EXPORT CONTROLLERS ==================
export {
  createRazorpayOrder,
  verifyRazorpayPayment,
  addOrderItems,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderToDelivered,
};
