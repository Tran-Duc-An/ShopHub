const mongoose = require('mongoose');

const giftProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relationship: {
    type: String,
    enum: ['girlfriend', 'boyfriend', 'wife', 'husband', 'mom', 'dad', 'sister', 'brother', 'friend', 'child', 'colleague', 'other'],
    required: true
  },
  birthday: { type: Date },
  interests: [{ type: String }],
  preferred_categories: [{ type: String }],
  price_range_min: { type: Number, default: 0 },
  price_range_max: { type: Number, default: 500 },
  notes: { type: String },
  gift_history: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    occasion: { type: String },
    date: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

giftProfileSchema.virtual('profile_id').get(function () {
  return this._id;
});

giftProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('GiftProfile', giftProfileSchema);
