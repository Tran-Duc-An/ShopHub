const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'seller', 'admin'], required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

userSchema.virtual('user_id').get(function () {
  return this._id;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
