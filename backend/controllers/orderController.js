const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Place an order from the current cart
// @route   POST /api/orders
const placeOrder = async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: cart ? 'Cart is empty' : 'No cart found. Add items first.' });
        }

        // Check stock for all items
        for (const item of cart.items) {
            if (item.product.stock_quantity < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for "${item.product.product_name}". Available: ${item.product.stock_quantity}`
                });
            }
        }

        const total = cart.items.reduce((sum, item) => sum + item.product.final_price * item.quantity, 0);
        const totalRounded = Math.round(total * 100) / 100;


        // Accept recipient info from request body (if provided)
        const recipientMap = (req.body.recipients || {});
        const orderItems = cart.items.map(item => {
            const productId = item.product._id.toString();
            const recipientInfo = recipientMap[productId] || {};
            return {
                product: item.product._id,
                quantity: item.quantity,
                price_at_purchase: item.product.final_price,
                recipient: recipientInfo.recipient || undefined,
                recipient_name: recipientInfo.recipient_name || undefined
            };
        });

        const order = await Order.create({
            user: userId,
            total_amount: totalRounded,
            items: orderItems
        });

        // Reduce stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock_quantity: -item.quantity }
            });
        }

        // Clear the cart
        cart.items = [];
        await cart.save();

        res.status(201).json({
            message: 'Order placed successfully',
            data: { order_id: order._id, total_amount: totalRounded, items: orderItems.length }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all orders for the logged-in user
// @route   GET /api/orders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ created_at: -1 });

        const data = orders.map(order => ({
            order_id: order._id,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            item_count: order.items.length
        }));

        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findOne({ _id: id, user: req.user.id })
            .populate('items.product', 'product_name brand image_url');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const items = order.items.map(item => ({
            order_item_id: item._id,
            product_id: item.product._id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
            product_name: item.product.product_name,
            brand: item.product.brand,
            image_url: item.product.image_url
        }));

        res.json({
            data: {
                order_id: order._id,
                user_id: order.user,
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
                items
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Cancel an order (only if still pending)
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findOne({ _id: id, user: req.user.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'pending') {
            return res.status(400).json({ message: `Cannot cancel order with status "${order.status}"` });
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock_quantity: item.quantity }
            });
        }

        order.status = 'cancelled';
        await order.save();
        res.json({ message: 'Order cancelled and stock restored' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder };
