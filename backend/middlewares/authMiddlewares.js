const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Check if the header has authorization and it starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                return res.status(500).json({ message: 'JWT secret is not configured on the server' });
            }

            // Verify token
            const decoded = jwt.verify(token, jwtSecret);

            // Attach user info to the request object so the next function can use it
            req.user = decoded; 
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Optional: Middleware to restrict routes to sellers only
const sellerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Sellers only.' });
    }
};

module.exports = { protect, sellerOnly };