// backend/routes/productRoutes.js
import express from 'express';
import { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (Get all products, Get single product)
router.route('/').get(getProducts);
router.route('/:id').get(getProductById);

// Admin routes (CRUD Operations)
router.route('/admin').post(protect, admin, createProduct); // Create Product
router.route('/admin/:id')
    .put(protect, admin, updateProduct) // Update Product
    .delete(protect, admin, deleteProduct); // Delete Product


export default router;