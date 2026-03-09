const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  added_at: { type: Date, default: Date.now }
});

cartItemSchema.virtual('cart_item_id').get(function () {
  return this._id;
});

cartItemSchema.set('toJSON', { virtuals: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: [cartItemSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

cartSchema.virtual('cart_id').get(function () {
  return this._id;
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
