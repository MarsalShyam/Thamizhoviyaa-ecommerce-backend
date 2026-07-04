
// backend/controllers/orderController.js
import dotenv from 'dotenv';
dotenv.config();

import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Product from '../models/Product.js';
import User from '../models/User.js';

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
    shippingPrice = 0,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // 🧮 Step 1: Calculate subtotal (sum of inclusive prices)
  const shownSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  // 🧮 Step 2: Reverse-calculate base price & 5% tax
  const itemsPrice = +(shownSubtotal / 1.05).toFixed(2); // base (excluding tax)
  const taxPrice = +(shownSubtotal - itemsPrice).toFixed(2); // GST (5%)
  const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

  // 🧮 Step 3: Create the order document
  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult: paymentResult || { id: 'COD_ORDER', status: 'Pending' },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: paymentMethod?.toLowerCase() === 'razorpay',
    paidAt: paymentMethod?.toLowerCase() === 'razorpay' ? Date.now() : null,

    // ✅ Default Order Status
    status: 'Ordered',
    statusHistory: [
      { status: 'Ordered', updatedBy: req.user._id, timestamp: Date.now() },
    ],
  });

  const createdOrder = await order.save();

  // 🧹 Step 4: Remove purchased items from the user’s cart
  if (orderItems && orderItems.length > 0) {
    const purchasedProductIds = orderItems.map((it) => it.product.toString());
    await CartItem.deleteMany({
      user: req.user._id,
      product: { $in: purchasedProductIds },
    });
  }

  // ✅ Step 5: Return clean response
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

// ================== ADMIN: GET DASHBOARD STATS ==================
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments({});
  const totalCustomers = await User.countDocuments({ isAdmin: false });
  const newOrders = await Order.countDocuments({ status: { $in: ['Ordered', 'Pending'] } });
  
  const allOrders = await Order.find({});
  const totalSales = allOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  // Sales Analytics (Today, This Week, This Month)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfThisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;

  allOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate >= startOfToday) {
      todaySales += order.totalPrice || 0;
    }
    if (orderDate >= startOfThisWeek) {
      weekSales += order.totalPrice || 0;
    }
    if (orderDate >= startOfThisMonth) {
      monthSales += order.totalPrice || 0;
    }
  });

  // Revenue Analytics & Graph Data (Last 7 Days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    last7Days.push({
      date: d,
      day: dayLabel,
      revenue: 0,
      orders: 0
    });
  }

  allOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    last7Days.forEach(day => {
      const nextDay = new Date(day.date.getTime() + 24 * 60 * 60 * 1000);
      if (orderDate >= day.date && orderDate < nextDay) {
        day.revenue += order.totalPrice || 0;
        day.orders += 1;
      }
    });
  });

  // Remove date objects before sending response
  const graphData = last7Days.map(({ day, revenue, orders }) => ({
    day,
    revenue: +revenue.toFixed(2),
    orders
  }));

  res.json({
    totalProducts,
    totalCustomers,
    newOrders,
    totalSales: +totalSales.toFixed(2),
    salesAnalytics: {
      today: +todaySales.toFixed(2),
      thisWeek: +weekSales.toFixed(2),
      thisMonth: +monthSales.toFixed(2),
    },
    revenueAnalytics: {
      totalRevenue: +totalSales.toFixed(2),
      graphData
    }
  });
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
  getDashboardStats,
};
