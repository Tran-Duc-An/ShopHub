const db = require('../config/db');

// @desc    Place an order from the current cart
// @route   POST /api/orders
const placeOrder = (req, res) => {
    const userId = req.user.id;

    // Get the user's cart
    db.get('SELECT * FROM carts WHERE user_id = ?', [userId], (err, cart) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!cart) return res.status(400).json({ message: 'No cart found. Add items first.' });

        // Get cart items with product prices
        const sql = `
            SELECT ci.quantity, p.product_id, p.final_price, p.stock_quantity, p.product_name
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
        `;
        db.all(sql, [cart.cart_id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            if (items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

            // Check stock for all items
            for (const item of items) {
                if (item.stock_quantity < item.quantity) {
                    return res.status(400).json({
                        message: `Not enough stock for "${item.product_name}". Available: ${item.stock_quantity}`
                    });
                }
            }

            const total = items.reduce((sum, item) => sum + item.final_price * item.quantity, 0);
            const totalRounded = Math.round(total * 100) / 100;

            // Create order
            db.run('INSERT INTO orders (user_id, total_amount) VALUES (?, ?)', [userId, totalRounded], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                const orderId = this.lastID;

                // Insert order items and reduce stock
                const insertSql = 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)';
                const updateStockSql = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?';

                let completed = 0;
                let hasError = false;

                items.forEach(item => {
                    db.run(insertSql, [orderId, item.product_id, item.quantity, item.final_price], (err) => {
                        if (err && !hasError) { hasError = true; return res.status(500).json({ error: err.message }); }
                    });
                    db.run(updateStockSql, [item.quantity, item.product_id], (err) => {
                        if (err && !hasError) { hasError = true; return res.status(500).json({ error: err.message }); }

                        completed++;
                        if (completed === items.length && !hasError) {
                            // Clear the cart after successful order
                            db.run('DELETE FROM cart_items WHERE cart_id = ?', [cart.cart_id], (err) => {
                                if (err) return res.status(500).json({ error: err.message });
                                res.status(201).json({
                                    message: 'Order placed successfully',
                                    data: { order_id: orderId, total_amount: totalRounded, items: items.length }
                                });
                            });
                        }
                    });
                });
            });
        });
    });
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
const getMyOrders = (req, res) => {
    const sql = `
        SELECT o.order_id, o.status, o.total_amount, o.created_at,
               COUNT(oi.order_item_id) AS item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
    `;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
const getOrderById = (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', [id, req.user.id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const sql = `
            SELECT oi.*, p.product_name, p.brand, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `;
        db.all(sql, [id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: { ...order, items } });
        });
    });
};

// @desc    Cancel an order (only if still pending)
// @route   PUT /api/orders/:id/cancel
const cancelOrder = (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', [id, req.user.id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'pending') {
            return res.status(400).json({ message: `Cannot cancel order with status "${order.status}"` });
        }

        // Restore stock
        const sql = 'SELECT * FROM order_items WHERE order_id = ?';
        db.all(sql, [id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });

            items.forEach(item => {
                db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
                    [item.quantity, item.product_id]);
            });

            db.run("UPDATE orders SET status = 'cancelled' WHERE order_id = ?", [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Order cancelled and stock restored' });
            });
        });
    });
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder };
