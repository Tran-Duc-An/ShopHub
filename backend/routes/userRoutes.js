const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middlewares/authMiddlewares');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (Requires Token)
router.get('/profile', protect, (req, res) => {
    // req.user.id was extracted from the JWT token in the middleware!
    const sql = `SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?`;
    
    db.get(sql, [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ data: user });
    });
});

module.exports = router;