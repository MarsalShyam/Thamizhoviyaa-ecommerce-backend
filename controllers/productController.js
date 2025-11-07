// backend/controllers/productController.js
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // Check for 'featured' query parameter for Home page
    const filter = req.query.featured === 'true' ? { isFeatured: true } : {};

    const products = await Product.find(filter);
    res.json(products);
});

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const id = req.params.id;

    // 💥 FIX: Validate ID format before querying the DB
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404);
        throw new Error('Invalid product ID format');
    }
    
    const product = await Product.findById(id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// --- ADMIN FUNCTIONS ---

// @desc    Create a product
// @route   POST /api/products/admin
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    // Basic placeholder product data to start with
    const product = new Product({
        name: 'Sample Product Name ' + Date.now(),
        category: 'Sample Category',
        price: 0,
        description: 'Sample description.',
        fullDescription: 'Sample full description.',
        images: ['/images/placeholder.jpg'],
        countInStock: 0,
        user: req.user._id, // Associate product with the creating admin user
        isFeatured: false,
        benefits: ["Benefit 1", "Benefit 2"],
        usage: "Mix and apply.",
        ingredients: ["Ingredient 1"],
        size: "100g",
        sku: "TH-SAMPLE-001"
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, description, category, countInStock, images, isFeatured, originalPrice, fullDescription, benefits, usage, ingredients, size, sku } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        // Update all fields from the request body
        product.name = name || product.name;
        product.price = price !== undefined ? price : product.price;
        product.description = description || product.description;
        product.category = category || product.category;
        product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
        product.images = images || product.images;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
        product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
        product.fullDescription = fullDescription || product.fullDescription;
        product.benefits = benefits || product.benefits;
        product.usage = usage || product.usage;
        product.ingredients = ingredients || product.ingredients;
        product.size = size || product.size;
        product.sku = sku || product.sku;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/admin/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

export { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
};