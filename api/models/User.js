const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  profileImageUrl: { type: String, default: '' },
  
  // Wallet
  walletBalance: { type: Number, default: 0 },
  savingsBalance: { type: Number, default: 0 },
  
  // Virtual Account
  virtualAccountNumber: { type: String, unique: true },
  virtualAccountBank: { type: String, default: 'Wema Bank' },
  
  // KYC
  bvn: String,
  isVerified: { type: Boolean, default: false },
  
  // Financial Score
  financialScore: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
