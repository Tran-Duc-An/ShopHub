const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  message: { type: String, required: true },
  feedbackType: { type: String, enum: ['like', 'dislike', 'neutral', null], default: null },
  rating: { type: Number, min: 1, max: 5 },
  context: { type: String }, // e.g., 'girlfriend', 'wife', etc.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
