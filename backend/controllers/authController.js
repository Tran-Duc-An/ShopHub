const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET;

// @desc    Register a new user (Customer or Seller)
// @route   POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['customer', 'seller'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either customer or seller' });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        
        db.run(sql, [name, email, hashedPassword, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            const jwtSecret = getJwtSecret();
            if (!jwtSecret) {
                return res.status(500).json({ message: 'JWT secret is not configured on the server' });
            }

            // Generate Token
            const token = jwt.sign({ id: this.lastID, role }, jwtSecret, { expiresIn: '30d' });

            res.status(201).json({
                message: 'User created successfully',
                user: { id: this.lastID, name, email, role },
                token
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const jwtSecret = getJwtSecret();
        if (!jwtSecret) {
            return res.status(500).json({ message: 'JWT secret is not configured on the server' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.user_id, role: user.role }, jwtSecret, { expiresIn: '30d' });

        res.json({
            message: 'Logged in successfully',
            user: { id: user.user_id, name: user.name, email: user.email, role: user.role },
            token
        });
    });
};

module.exports = { signup, login };