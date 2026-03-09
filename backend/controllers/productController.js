const db = require('../config/db');

// @desc    Fetch products with optional filters (combine any of them)
// @route   GET /api/products?q=keyword&brand=Nike&minPrice=10&maxPrice=50&rating=4&sort=price_asc
const getProducts = (req, res) => {
    const { q, brand, category, minPrice, maxPrice, rating, sort } = req.query;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let whereSql = ' WHERE 1=1';
    const params = [];

    // Text search across name, brand, description
    if (q) {
        whereSql += ' AND (p.product_name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
        const term = `%${q}%`;
        params.push(term, term, term);
    }

    // Brand filter (partial match)
    if (brand) {
        whereSql += ' AND p.brand LIKE ?';
        params.push(`%${brand}%`);
    }

    // Category filter (exact match)
    if (category) {
        whereSql += ' AND p.category = ?';
        params.push(category);
    }

    // Price range
    if (minPrice) {
        whereSql += ' AND p.final_price >= ?';
        params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
        whereSql += ' AND p.final_price <= ?';
        params.push(parseFloat(maxPrice));
    }

    // Minimum rating
    if (rating) {
        const r = parseFloat(rating);
        if (isNaN(r) || r < 0 || r > 5) {
            return res.status(400).json({ message: 'Rating must be between 0 and 5' });
        }
        whereSql += ' AND p.rating >= ?';
        params.push(r);
    }

    // Sorting
    let orderSql = '';
    switch (sort) {
        case 'price_asc':  orderSql = ' ORDER BY p.final_price ASC';  break;
        case 'price_desc': orderSql = ' ORDER BY p.final_price DESC'; break;
        case 'rating':     orderSql = ' ORDER BY p.rating DESC';      break;
        case 'newest':     orderSql = ' ORDER BY p.created_at DESC';  break;
        default:           orderSql = ' ORDER BY p.product_id DESC';  break;
    }

    const baseSql = `FROM products p LEFT JOIN users u ON p.seller_id = u.user_id` + whereSql;

    // Get total count first
    db.get(`SELECT COUNT(*) as total ${baseSql}`, params, (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });

        const total = countRow.total;
        const totalPages = Math.ceil(total / limit);

        const dataSql = `SELECT p.*, u.name AS seller_name ${baseSql}${orderSql} LIMIT ? OFFSET ?`;
        db.all(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: rows, page, limit, total, totalPages });
        });
    });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
const getProductById = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, u.name AS seller_name 
        FROM products p 
        LEFT JOIN users u ON p.seller_id = u.user_id
        WHERE p.product_id = ?
    `;
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Product not found' });
        res.json({ data: row });
    });
};

// @desc    Get products for the logged-in seller
// @route   GET /api/products/seller/me
const getSellerProducts = (req, res) => {
    const sql = `
        SELECT p.*, u.name AS seller_name 
        FROM products p 
        LEFT JOIN users u ON p.seller_id = u.user_id
        WHERE p.seller_id = ?
        ORDER BY p.created_at DESC
    `;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
};

// @desc    Get seller info and their products (public)
// @route   GET /api/products/seller/:sellerId
const getSellerPublicProducts = (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    if (isNaN(sellerId)) return res.status(400).json({ message: 'Invalid seller ID' });

    db.get('SELECT user_id, name FROM users WHERE user_id = ?', [sellerId], (err, seller) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!seller) return res.status(404).json({ message: 'Seller not found' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const sort = req.query.sort;

        let orderSql = '';
        switch (sort) {
            case 'price_asc':  orderSql = ' ORDER BY p.final_price ASC';  break;
            case 'price_desc': orderSql = ' ORDER BY p.final_price DESC'; break;
            case 'rating':     orderSql = ' ORDER BY p.rating DESC';      break;
            case 'newest':     orderSql = ' ORDER BY p.created_at DESC';  break;
            default:           orderSql = ' ORDER BY p.product_id DESC';  break;
        }

        db.get('SELECT COUNT(*) as total FROM products WHERE seller_id = ?', [sellerId], (err, countRow) => {
            if (err) return res.status(500).json({ error: err.message });
            const total = countRow.total;
            const totalPages = Math.ceil(total / limit);

            const sql = `SELECT p.*, u.name AS seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.user_id WHERE p.seller_id = ?${orderSql} LIMIT ? OFFSET ?`;
            db.all(sql, [sellerId, limit, offset], (err, products) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ seller, data: products, page, limit, total, totalPages });
            });
        });
    });
};

// @desc    Create a new product
// @route   POST /api/products
const createProduct = (req, res) => {
    const { product_name, description, brand, initial_price, final_price, currency, image_url, stock_quantity } = req.body;

    if (!product_name || !final_price) {
        return res.status(400).json({ message: 'Product name and final price are required' });
    }

    const sql = `
        INSERT INTO products (seller_id, product_name, description, brand, initial_price, final_price, currency, image_url, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        req.user.id,
        product_name,
        description || null,
        brand || null,
        initial_price || null,
        final_price,
        currency || 'USD',
        image_url || null,
        stock_quantity || 100
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            message: 'Product created successfully',
            data: { product_id: this.lastID, seller_id: req.user.id, product_name, brand, final_price }
        });
    });
};

// @desc    Update a product (only owner)
// @route   PUT /api/products/:id
const updateProduct = (req, res) => {
    const { id } = req.params;

    // First check if the product belongs to the seller
    db.get('SELECT * FROM products WHERE product_id = ?', [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own products' });
        }

        const { product_name, description, brand, initial_price, final_price, currency, image_url, stock_quantity } = req.body;

        const sql = `
            UPDATE products SET
                product_name = COALESCE(?, product_name),
                description = COALESCE(?, description),
                brand = COALESCE(?, brand),
                initial_price = COALESCE(?, initial_price),
                final_price = COALESCE(?, final_price),
                currency = COALESCE(?, currency),
                image_url = COALESCE(?, image_url),
                stock_quantity = COALESCE(?, stock_quantity)
            WHERE product_id = ?
        `;
        const params = [
            product_name || null, description || null, brand || null,
            initial_price || null, final_price || null, currency || null,
            image_url || null, stock_quantity || null, id
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated successfully', changes: this.changes });
        });
    });
};

// @desc    Delete a product (only owner)
// @route   DELETE /api/products/:id
const deleteProduct = (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM products WHERE product_id = ?', [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own products' });
        }

        db.run('DELETE FROM products WHERE product_id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product deleted successfully' });
        });
    });
};

// @desc    Get all categories with product count and sample products
// @route   GET /api/products/categories
const getCategories = (req, res) => {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));
    const sellerId = req.query.seller_id;

    let whereClause = 'WHERE category IS NOT NULL';
    const baseParams = [];
    if (sellerId) {
        whereClause += ' AND p.seller_id = ?';
        baseParams.push(parseInt(sellerId));
    }

    db.all(
        `SELECT p.category, COUNT(*) as count FROM products p ${whereClause} GROUP BY p.category ORDER BY count DESC`,
        baseParams,
        (err, categories) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const results = [];
            let pending = categories.length;
            if (pending === 0) return res.json({ data: [] });
            
            categories.forEach(cat => {
                let productWhere = 'WHERE p.category = ?';
                const productParams = [cat.category];
                if (sellerId) {
                    productWhere += ' AND p.seller_id = ?';
                    productParams.push(parseInt(sellerId));
                }
                productParams.push(limit);

                db.all(
                    `SELECT p.*, u.name AS seller_name FROM products p LEFT JOIN users u ON p.seller_id = u.user_id ${productWhere} ORDER BY p.rating DESC LIMIT ?`,
                    productParams,
                    (err, products) => {
                        if (err) products = [];
                        results.push({ category: cat.category, count: cat.count, products });
                        pending--;
                        if (pending === 0) {
                            results.sort((a, b) => b.count - a.count);
                            res.json({ data: results });
                        }
                    }
                );
            });
        }
    );
};

module.exports = { getProducts, getProductById, getSellerProducts, getSellerPublicProducts, createProduct, updateProduct, deleteProduct, getCategories };