// backend/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  description: { type: String, required: true },
  fullDescription: { type: String },
  benefits: [{ type: String }],
  usage: { type: String },
  ingredients: [{ type: String }],
  size: { type: String },
  images: [{ type: String }], // Array of image URLs
  inStock: { type: Boolean, default: true },
  countInStock: { type: Number, default: 0 },
  sku: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
export default Product;