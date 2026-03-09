const Product = require('../models/Product');
const User = require('../models/User');

// Helper: format a product document for the API response
const formatProduct = (p) => {
    const json = p.toJSON();
    json.product_id = p._id;
    json.seller_id = p.seller?._id || p.seller;
    json.seller_name = p.seller?.name || null;
    delete json.seller;
    return json;
};

// @desc    Fetch products with optional filters
// @route   GET /api/products?q=keyword&brand=Nike&minPrice=10&maxPrice=50&rating=4&sort=price_asc
const getProducts = async (req, res) => {
    const { q, brand, category, minPrice, maxPrice, rating, sort } = req.query;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (q) {
        const regex = new RegExp(q, 'i');
        filter.$or = [
            { product_name: regex },
            { brand: regex },
            { description: regex }
        ];
    }

    if (brand) filter.brand = new RegExp(brand, 'i');
    if (category) filter.category = category;

    if (minPrice || maxPrice) {
        filter.final_price = {};
        if (minPrice) filter.final_price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.final_price.$lte = parseFloat(maxPrice);
    }

    if (rating) {
        const r = parseFloat(rating);
        if (isNaN(r) || r < 0 || r > 5) {
            return res.status(400).json({ message: 'Rating must be between 0 and 5' });
        }
        filter.rating = { $gte: r };
    }

    let sortOption = { _id: -1 };
    switch (sort) {
        case 'price_asc':  sortOption = { final_price: 1 };  break;
        case 'price_desc': sortOption = { final_price: -1 }; break;
        case 'rating':     sortOption = { rating: -1 };      break;
        case 'newest':     sortOption = { created_at: -1 };  break;
    }

    try {
        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).populate('seller', 'name').sort(sortOption).skip(skip).limit(limit)
        ]);

        const totalPages = Math.ceil(total / limit);
        const data = products.map(formatProduct);

        res.json({ data, page, limit, total, totalPages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('seller', 'name');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ data: formatProduct(product) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get products for the logged-in seller
// @route   GET /api/products/seller/me
const getSellerProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user.id })
            .populate('seller', 'name')
            .sort({ created_at: -1 });
        res.json({ data: products.map(formatProduct) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get seller info and their products (public)
// @route   GET /api/products/seller/:sellerId
const getSellerPublicProducts = async (req, res) => {
    const sellerId = req.params.sellerId;

    try {
        const sellerDoc = await User.findById(sellerId).select('name');
        if (!sellerDoc) return res.status(404).json({ message: 'Seller not found' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        let sortOption = { _id: -1 };
        switch (req.query.sort) {
            case 'price_asc':  sortOption = { final_price: 1 };  break;
            case 'price_desc': sortOption = { final_price: -1 }; break;
            case 'rating':     sortOption = { rating: -1 };      break;
            case 'newest':     sortOption = { created_at: -1 };  break;
        }

        const [total, products] = await Promise.all([
            Product.countDocuments({ seller: sellerId }),
            Product.find({ seller: sellerId }).populate('seller', 'name').sort(sortOption).skip(skip).limit(limit)
        ]);

        const totalPages = Math.ceil(total / limit);
        const seller = { user_id: sellerDoc._id, name: sellerDoc.name };

        res.json({ seller, data: products.map(formatProduct), page, limit, total, totalPages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create a new product
// @route   POST /api/products
const createProduct = async (req, res) => {
    const { product_name, description, brand, initial_price, final_price, currency, image_url, stock_quantity } = req.body;

    if (!product_name || !final_price) {
        return res.status(400).json({ message: 'Product name and final price are required' });
    }

    try {
        const product = await Product.create({
            seller: req.user.id,
            product_name,
            description: description || null,
            brand: brand || null,
            initial_price: initial_price || null,
            final_price,
            currency: currency || 'USD',
            image_url: image_url || null,
            stock_quantity: stock_quantity || 100
        });

        res.status(201).json({
            message: 'Product created successfully',
            data: { product_id: product._id, seller_id: req.user.id, product_name, brand, final_price }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update a product (only owner)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own products' });
        }

        const { product_name, description, brand, initial_price, final_price, currency, image_url, stock_quantity } = req.body;

        if (product_name) product.product_name = product_name;
        if (description) product.description = description;
        if (brand) product.brand = brand;
        if (initial_price) product.initial_price = initial_price;
        if (final_price) product.final_price = final_price;
        if (currency) product.currency = currency;
        if (image_url) product.image_url = image_url;
        if (stock_quantity) product.stock_quantity = stock_quantity;

        await product.save();
        res.json({ message: 'Product updated successfully', changes: 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a product (only owner)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own products' });
        }

        await product.deleteOne();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all categories with product count and sample products
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));
    const sellerId = req.query.seller_id;

    try {
        const matchStage = { category: { $ne: null } };
        if (sellerId) matchStage.seller = new (require('mongoose').Types.ObjectId)(sellerId);

        const categories = await Product.aggregate([
            { $match: matchStage },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const results = await Promise.all(categories.map(async (cat) => {
            const filter = { category: cat._id };
            if (sellerId) filter.seller = sellerId;

            const products = await Product.find(filter)
                .populate('seller', 'name')
                .sort({ rating: -1 })
                .limit(limit);

            return {
                category: cat._id,
                count: cat.count,
                products: products.map(formatProduct)
            };
        }));

        res.json({ data: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProducts, getProductById, getSellerProducts, getSellerPublicProducts, createProduct, updateProduct, deleteProduct, getCategories };