const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Investment details
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['stocks', 'bonds', 'mutual_funds', 'crypto', '固定存款', 'savings', 'real_estate', 'ppp', 'treasury', 'other'],
    required: true 
  },
  
  // Platform/provider
  platform: String,
  accountNumber: String,
  
  // Amount invested
  investedAmount: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  
  // Currency
  currency: { type: String, default: 'NGN' },
  
  // Exchange rate (for forex)
  exchangeRate: { type: Number, default: 1 },
  
  // Returns
  returns: { type: Number, default: 0 },
  returnsPercentage: { type: Number, default: 0 },
  
  // Date
  purchaseDate: Date,
  purchasePrice: Number,
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'sold', 'liquidated'],
    default: 'active' 
  },
  
  // Tracking
  lastUpdated: Date,
  
  // Notes
  notes: String,
  
  // Historical values for charting
  valueHistory: [{
    value: Number,
    date: Date
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

investmentSchema.index({ userId: 1, status: 1 });

// Calculate returns
investmentSchema.methods.calculateReturns = function() {
  if (this.investedAmount > 0) {
    this.returns = this.currentValue - this.investedAmount;
    this.returnsPercentage = (this.returns / this.investedAmount) * 100;
  }
  return this;
};

module.exports = mongoose.model('Investment', investmentSchema);

