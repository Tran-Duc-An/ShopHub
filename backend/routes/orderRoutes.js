const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddlewares');

// All order routes require authentication
router.use(protect);

router.post('/', placeOrder);                 // POST   /api/orders
router.get('/', getMyOrders);                 // GET    /api/orders
router.get('/:id', getOrderById);             // GET    /api/orders/:id
router.put('/:id/cancel', cancelOrder);       // PUT    /api/orders/:id/cancel

module.exports = router;
