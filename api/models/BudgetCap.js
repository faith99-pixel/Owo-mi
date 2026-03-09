const mongoose = require('mongoose');

const budgetCapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Category for the budget
  category: { 
    type: String, 
    enum: ['TRANSPORT', 'FOOD', 'AIRTIME', 'DATA', 'BETTING', 'POS', 'SHOPPING', 'ENTERTAINMENT', 'TRANSFER', 'OTHER'],
    required: true 
  },
  
  // Budget limit
  limitAmount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  // Period
  period: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'], 
    default: 'monthly' 
  },
  
  // Current spending in period
  currentSpending: { type: Number, default: 0 },
  
  // Period start and end
  periodStart: Date,
  periodEnd: Date,
  
  // Alert settings
  alertEnabled: { type: Boolean, default: true },
  alertThreshold: { type: Number, default: 80 }, // Alert at X% of limit
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'exceeded'],
    default: 'active' 
  },
  
  // Alert history
  alerts: [{
    date: Date,
    percentage: Number,
    message: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

budgetCapSchema.index({ userId: 1, category: 1, period: 1 });
budgetCapSchema.index({ periodEnd: 1 });

// Virtual for percentage used
budgetCapSchema.virtual('percentageUsed').get(function() {
  if (this.limitAmount <= 0) return 0;
  return Math.round((this.currentSpending / this.limitAmount) * 100);
});

// Virtual for remaining amount
budgetCapSchema.virtual('remaining').get(function() {
  return Math.max(0, this.limitAmount - this.currentSpending);
});

module.exports = mongoose.model('BudgetCap', budgetCapSchema);

