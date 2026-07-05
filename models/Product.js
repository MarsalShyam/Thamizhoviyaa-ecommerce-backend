// backend/models/Product.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

const sectionSchema = new mongoose.Schema({
  type: { type: String, enum: ['format1', 'format2', 'format3'], required: true },
  heading: { type: String, required: true },
  subheading: { type: String },
  description: { type: String },
  subsections: [
    {
      subheading: { type: String },
      description: { type: String },
      tableData: [
        {
          key: { type: String },
          value: { type: String }
        }
      ]
    }
  ]
});

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
  attributes: [
    {
      name: { type: String },
      value: { type: String }
    }
  ],
  variants: [
    {
      name: { type: String },
      color: { type: String },
      size: { type: String },
      price: { type: Number },
      stock: { type: Number, default: 0 },
      sku: { type: String }
    }
  ],
  shipping: {
    weight: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    shippingClass: { type: String, default: '' }
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' }
  },
  aboutThisItem: [sectionSchema],
  productInformation: [sectionSchema],
  fromTheBrand: [sectionSchema],
  reviewsList: [reviewSchema]
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
export default Product;