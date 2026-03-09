const mongoose = require('mongoose');

const sinkingFundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Fund details
  name: { type: String, required: true },
  description: String,
  emoji: { type: String, default: '🏦' },
  
  // Target amount
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  
  // Currency
  currency: { type: String, default: 'NGN' },
  
  // Frequency of expense
  frequency: { 
    type: String, 
    enum: ['annual', 'quarterly', 'biannual', 'one_time'],
    required: true 
  },
  
  // When the expense is due
  nextDueDate: { type: Date, required: true },
  
  // How much to save monthly to reach goal
  monthlyContribution: Number,
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'expired'],
    default: 'active' 
  },
  
  // Category
  category: { 
    type: String, 
    enum: ['christmas', 'rent', 'school_fees', 'insurance', 'subscription', 'travel', 'medical', 'car', 'home', 'other'],
    default: 'other'
  },
  
  // Track contributions
  contributions: [{
    amount: Number,
    date: Date,
    note: String
  }],
  
  // Track withdrawals/usage
  withdrawals: [{
    amount: Number,
    date: Date,
    note: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

sinkingFundSchema.index({ userId: 1, status: 1 });
sinkingFundSchema.index({ nextDueDate: 1 });

// Virtual for progress
sinkingFundSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

// Virtual for days until due
sinkingFundSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.nextDueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('SinkingFund', sinkingFundSchema);

