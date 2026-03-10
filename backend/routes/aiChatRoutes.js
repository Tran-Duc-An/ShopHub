const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddlewares');
const { chat, suggest, getFeedback, postFeedback } = require('../controllers/aiChatController');


router.use(protect);

router.post('/', chat);
router.post('/suggest', suggest);
// Feedback endpoints
router.get('/feedback', getFeedback);
router.post('/feedback', postFeedback);

module.exports = router;
