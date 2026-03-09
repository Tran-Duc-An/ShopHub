const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddlewares');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (Requires Token)
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            data: {
                user_id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;