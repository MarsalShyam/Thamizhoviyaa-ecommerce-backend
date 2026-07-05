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
    const { 
        name, 
        price, 
        description, 
        category, 
        countInStock, 
        images, 
        isFeatured, 
        originalPrice, 
        fullDescription, 
        benefits, 
        usage, 
        ingredients, 
        size, 
        sku,
        attributes,
        variants,
        shipping,
        seo,
        aboutThisItem,
        productInformation,
        fromTheBrand
    } = req.body;

    const product = new Product({
        name: name || 'Sample Product Name ' + Date.now(),
        category: category || 'Sample Category',
        price: price !== undefined ? price : 0,
        description: description || 'Sample description.',
        fullDescription: fullDescription || 'Sample full description.',
        images: images && images.length > 0 ? images : ['/images/placeholder.jpg'],
        countInStock: countInStock !== undefined ? countInStock : 0,
        user: req.user._id,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        benefits: benefits || ["Benefit 1", "Benefit 2"],
        usage: usage || "Mix and apply.",
        ingredients: ingredients || ["Ingredient 1"],
        size: size || "100g",
        sku: sku || "TH-SAMPLE-001",
        originalPrice: originalPrice !== undefined ? originalPrice : 0,
        attributes: attributes || [],
        variants: variants || [],
        shipping: shipping || { weight: 0, width: 0, height: 0, length: 0, shippingClass: '' },
        seo: seo || { metaTitle: '', metaDescription: '', metaKeywords: '' },
        aboutThisItem: aboutThisItem || [],
        productInformation: productInformation || [],
        fromTheBrand: fromTheBrand || []
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { 
        name, 
        price, 
        description, 
        category, 
        countInStock, 
        images, 
        isFeatured, 
        originalPrice, 
        fullDescription, 
        benefits, 
        usage, 
        ingredients, 
        size, 
        sku,
        attributes,
        variants,
        shipping,
        seo,
        aboutThisItem,
        productInformation,
        fromTheBrand
    } = req.body;

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
        
        // Dynamic & Custom Fields
        product.attributes = attributes !== undefined ? attributes : product.attributes;
        product.variants = variants !== undefined ? variants : product.variants;
        product.shipping = shipping !== undefined ? shipping : product.shipping;
        product.seo = seo !== undefined ? seo : product.seo;
        product.aboutThisItem = aboutThisItem !== undefined ? aboutThisItem : product.aboutThisItem;
        product.productInformation = productInformation !== undefined ? productInformation : product.productInformation;
        product.fromTheBrand = fromTheBrand !== undefined ? fromTheBrand : product.fromTheBrand;

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

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const alreadyReviewed = product.reviewsList.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Product already reviewed');
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviewsList.push(review);
        product.reviews = product.reviewsList.length;
        product.rating =
            product.reviewsList.reduce((acc, item) => item.rating + acc, 0) /
            product.reviewsList.length;

        await product.save();
        res.status(201).json({ message: 'Review added' });
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
    deleteProduct,
    createProductReview
};