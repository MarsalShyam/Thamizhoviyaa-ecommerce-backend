// backend/server.js

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';// Optional: for professional error handling

// Import custom DB connection helper (optional if you already use connectDB)
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';

// Load environment variables
dotenv.config();
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);

// --- Initialize App ---
const app = express();

// --- Middleware ---
app.use(cors());              // Enable CORS for frontend-backend communication
app.use(express.json());      // Parse incoming JSON requests


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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use('/api/upload', uploadRoutes);


app.use('/api/users', userRoutes);

app.use('/api/orders', orderRoutes);
app.use("/api/pdf", pdfRoutes);



// --- Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express server is running!' });
});

// --- Global Error Handling ---
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
});
