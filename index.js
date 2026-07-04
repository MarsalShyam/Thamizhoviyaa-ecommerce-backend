// backend/server.js
import 'dotenv/config'; // Load environment variables before all imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import custom DB connection helper (optional if you already use connectDB)
import connectDB from './config/db.js';

// Import Routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import { handleClerkWebhook } from './controllers/clerkWebhookController.js';

// --- Initialize App ---
const app = express();

// --- Clerk Webhook Route (MUST be before express.json() to verify raw signature) ---
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

// --- Middleware ---
app.use(cors());              // Enable CORS for frontend-backend communication
app.use(express.json());      // Parse incoming JSON requests
app.use(clerkMiddleware());   // Populate req.auth with Clerk session info

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Atlas connected successfully!'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
} else {
  // If connectDB() is defined separately, use it
  connectDB();
}

// --- Routes ---
app.get('/', (req, res) => {
  res.send('🚀 API is running successfully!');
});

app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use("/api/pdf", pdfRoutes);
app.use('/api/blogs', blogRoutes);



// --- Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running!' });
});

// --- Global Error Handling ---
// app.use((err, req, res, next) => {
//   console.error('💥 Error:', err.stack);
//   res.status(500).json({ error: 'Internal Server Error' });
// });
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
});
