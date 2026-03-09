const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET;

// @desc    Register a new user (Customer or Seller)
// @route   POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!['customer', 'seller'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either customer or seller' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, password: hashedPassword, role });

        const jwtSecret = getJwtSecret();
        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured on the server' });
        }

        const token = jwt.sign({ id: user._id, role }, jwtSecret, { expiresIn: '30d' });

        res.status(201).json({
            message: 'User created successfully',
            user: { id: user._id, name, email, role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const jwtSecret = getJwtSecret();
        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured on the server' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '30d' });

        res.json({
            message: 'Logged in successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup, login };