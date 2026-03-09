const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddlewares');

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);                     // GET    /api/cart
router.post('/', addToCart);                  // POST   /api/cart
router.put('/:cartItemId', updateCartItem);   // PUT    /api/cart/:cartItemId
router.delete('/:cartItemId', removeCartItem);// DELETE /api/cart/:cartItemId
router.delete('/', clearCart);                // DELETE /api/cart

module.exports = router;
