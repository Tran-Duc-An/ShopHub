const db = require('../config/db');

// Helper: get or create a cart for the logged-in user
const getOrCreateCart = (userId, callback) => {
    db.get('SELECT * FROM carts WHERE user_id = ?', [userId], (err, cart) => {
        if (err) return callback(err);
        if (cart) return callback(null, cart);

        db.run('INSERT INTO carts (user_id) VALUES (?)', [userId], function(err) {
            if (err) return callback(err);
            callback(null, { cart_id: this.lastID, user_id: userId });
        });
    });
};

// @desc    Get current user's cart with items
// @route   GET /api/cart
const getCart = (req, res) => {
    getOrCreateCart(req.user.id, (err, cart) => {
        if (err) return res.status(500).json({ error: err.message });

        const sql = `
            SELECT ci.cart_item_id, ci.quantity, ci.added_at,
                   p.product_id, p.product_name, p.brand, p.final_price, p.image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
        `;
        db.all(sql, [cart.cart_id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });

            const total = items.reduce((sum, item) => sum + item.final_price * item.quantity, 0);
            res.json({ data: { cart_id: cart.cart_id, items, total: Math.round(total * 100) / 100 } });
        });
    });
};

// @desc    Add item to cart (or increase quantity if exists)
// @route   POST /api/cart
const addToCart = (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id) return res.status(400).json({ message: 'product_id is required' });
    const qty = parseInt(quantity) || 1;

    // Check product exists and has stock
    db.get('SELECT * FROM products WHERE product_id = ?', [product_id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.stock_quantity < qty) {
            return res.status(400).json({ message: `Only ${product.stock_quantity} items in stock` });
        }

        getOrCreateCart(req.user.id, (err, cart) => {
            if (err) return res.status(500).json({ error: err.message });

            // Upsert: insert or update quantity if item already in cart
            const sql = `
                INSERT INTO cart_items (cart_id, product_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT(cart_id, product_id) DO UPDATE SET quantity = quantity + ?
            `;
            db.run(sql, [cart.cart_id, product_id, qty, qty], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: 'Item added to cart' });
            });
        });
    });
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:cartItemId
const updateCartItem = (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (!qty || qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    // Verify ownership via cart
    const sql = `
        SELECT ci.*, c.user_id FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        WHERE ci.cart_item_id = ?
    `;
    db.get(sql, [cartItemId], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ message: 'Cart item not found' });
        if (item.user_id !== req.user.id) return res.status(403).json({ message: 'Not your cart' });

        db.run('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [qty, cartItemId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Cart item updated' });
        });
    });
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:cartItemId
const removeCartItem = (req, res) => {
    const { cartItemId } = req.params;

    const sql = `
        SELECT ci.*, c.user_id FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        WHERE ci.cart_item_id = ?
    `;
    db.get(sql, [cartItemId], (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(404).json({ message: 'Cart item not found' });
        if (item.user_id !== req.user.id) return res.status(403).json({ message: 'Not your cart' });

        db.run('DELETE FROM cart_items WHERE cart_item_id = ?', [cartItemId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Item removed from cart' });
        });
    });
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
const clearCart = (req, res) => {
    getOrCreateCart(req.user.id, (err, cart) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run('DELETE FROM cart_items WHERE cart_id = ?', [cart.cart_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Cart cleared', removed: this.changes });
        });
    });
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
