// // backend/models/Order.js
// import mongoose from 'mongoose';

// const orderItemSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   qty: { type: Number, required: true },
//   image: { type: String },
//   price: { type: Number, required: true },
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'Product',
//   },
// });

// const shippingAddressSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   address: { type: String, required: true },
//   city: { type: String, required: true },
//   pincode: { type: String, required: true },
// });

// const orderSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'User',
//   },
//   orderItems: [orderItemSchema],
//   shippingAddress: shippingAddressSchema,
//   paymentMethod: {
//     type: String,
//     required: true,
//     default: 'Razorpay',
//   },
//   paymentResult: {
//     id: { type: String },
//     status: { type: String },
//     update_time: { type: String },
//     email_address: { type: String },
//   },
//   taxPrice: {
//     type: Number,
//     required: true,
//     default: 0.0,
//   },
//   shippingPrice: {
//     type: Number,
//     required: true,
//     default: 0.0,
//   },
//   totalPrice: {
//     type: Number,
//     required: true,
//     default: 0.0,
//   },
//   isPaid: {
//     type: Boolean,
//     required: true,
//     default: false,
//   },
//   paidAt: {
//     type: Date,
//   },
//   isDelivered: {
//     type: Boolean,
//     required: true,
//     default: false,
//   },
//   deliveredAt: {
//     type: Date,
//   },
// }, {
//   timestamps: true,
// });

// const Order = mongoose.model('Order', orderSchema);
// export default Order;

// backend/models/Order.js
import mongoose from 'mongoose';

// ----------------- Order Item Schema -----------------
const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
  },
  { _id: false }
);

// ----------------- Status History Schema -----------------
const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true }, // e.g. Ordered, Packed, Shipped, Delivered, Cancelled
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    note: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ----------------- Main Order Schema -----------------
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    orderItems: [orderItemSchema],

    shippingAddress: {
      fullName: { type: String },
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
    },

    paymentMethod: { type: String },

    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },

    itemsPrice: { type: Number, default: 0.0 },
    taxPrice: { type: Number, default: 0.0 },
    shippingPrice: { type: Number, default: 0.0 },
    totalPrice: { type: Number, default: 0.0 },

    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // ✅ STATUS MANAGEMENT
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Ordered', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Ordered',
    },

    // ✅ STATUS HISTORY (Timeline of updates)
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// ----------------- Model Creation -----------------
const Order = mongoose.model('Order', orderSchema);
export default Order;
