const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price_at_purchase: { type: Number, required: true },
  recipient: { type: String, enum: ['girlfriend', 'boyfriend', 'wife', 'husband', 'mom', 'dad', 'sister', 'brother', 'friend', 'child', 'colleague', 'other'], required: false },
  recipient_name: { type: String, required: false }
});

orderItemSchema.virtual('order_item_id').get(function () {
  return this._id;
});

orderItemSchema.set('toJSON', { virtuals: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total_amount: { type: Number, required: true },
  items: [orderItemSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

orderSchema.virtual('order_id').get(function () {
  return this._id;
});

orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
