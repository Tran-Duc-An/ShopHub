const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddlewares');
const { chat, suggest } = require('../controllers/aiChatController');

router.use(protect);

router.post('/', chat);
router.post('/suggest', suggest);

module.exports = router;
