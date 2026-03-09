const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getSellerProducts, getSellerPublicProducts, createProduct, updateProduct, deleteProduct, getCategories } = require('../controllers/productController');
const { protect, sellerOnly } = require('../middlewares/authMiddlewares');

// Public routes
router.get('/', getProducts);                          // All filters via query params
router.get('/categories', getCategories);              // All categories with sample products
router.get('/seller/me', protect, sellerOnly, getSellerProducts); // Seller's own products
router.get('/seller/:sellerId', getSellerPublicProducts);  // Public seller page
router.get('/:id', getProductById);                    // Single product by ID

// Seller-only routes (require login + seller role)
router.post('/', protect, sellerOnly, createProduct);          // Create product
router.put('/:id', protect, sellerOnly, updateProduct);        // Update product
router.delete('/:id', protect, sellerOnly, deleteProduct);     // Delete product

module.exports = router;