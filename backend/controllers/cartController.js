const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get current user's cart with items
// @route   GET /api/cart
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'product_name brand final_price image_url');

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        const items = cart.items.map(item => ({
            cart_item_id: item._id,
            quantity: item.quantity,
            added_at: item.added_at,
            product_id: item.product._id,
            product_name: item.product.product_name,
            brand: item.product.brand,
            final_price: item.product.final_price,
            image_url: item.product.image_url
        }));

        const total = items.reduce((sum, item) => sum + item.final_price * item.quantity, 0);
        res.json({ data: { cart_id: cart._id, items, total: Math.round(total * 100) / 100 } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Add item to cart (or increase quantity if exists)
// @route   POST /api/cart
const addToCart = async (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id) return res.status(400).json({ message: 'product_id is required' });
    const qty = parseInt(quantity) || 1;

    try {
        const product = await Product.findById(product_id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.stock_quantity < qty) {
            return res.status(400).json({ message: `Only ${product.stock_quantity} items in stock` });
        }

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        const existingItem = cart.items.find(item => item.product.toString() === product_id);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.items.push({ product: product_id, quantity: qty });
        }

        await cart.save();
        res.status(201).json({ message: 'Item added to cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:cartItemId
const updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (!qty || qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart item not found' });

        const item = cart.items.id(cartItemId);
        if (!item) return res.status(404).json({ message: 'Cart item not found' });

        item.quantity = qty;
        await cart.save();
        res.json({ message: 'Cart item updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:cartItemId
const removeCartItem = async (req, res) => {
    const { cartItemId } = req.params;

    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart item not found' });

        const item = cart.items.id(cartItemId);
        if (!item) return res.status(404).json({ message: 'Cart item not found' });

        item.deleteOne();
        await cart.save();
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.json({ message: 'Cart cleared', removed: 0 });

        const removed = cart.items.length;
        cart.items = [];
        await cart.save();
        res.json({ message: 'Cart cleared', removed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
