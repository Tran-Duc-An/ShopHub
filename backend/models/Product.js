const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product_name: { type: String, required: true },
  description: String,
  brand: String,
  initial_price: Number,
  final_price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  rating: Number,
  reviews_count: Number,
  image_url: String,
  category: String,
  stock_quantity: { type: Number, default: 100 }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

productSchema.virtual('product_id').get(function () {
  return this._id;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
