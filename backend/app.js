const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { protect, sellerOnly } = require('./middlewares/authMiddlewares');

const productRoutes     = require('./routes/productRoutes');
const userRoutes        = require('./routes/userRoutes');
const authRoutes        = require('./routes/authRoutes');
const cartRoutes        = require('./routes/cartRoutes');
const orderRoutes       = require('./routes/orderRoutes');
const giftProfileRoutes = require('./routes/giftProfileRoutes');
const aiChatRoutes      = require('./routes/aiChatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Image upload via multer
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
  }
});

app.post('/api/upload', protect, sellerOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Routes
app.use('/api/products',      productRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/cart',          cartRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/gift-profiles', giftProfileRoutes);
app.use('/api/ai-chat',       aiChatRoutes);

module.exports = app;