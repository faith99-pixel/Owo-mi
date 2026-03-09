const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Subscription details
  name: { type: String, required: true },
  provider: String, // Netflix, DSTV, etc.
  category: { 
    type: String, 
    enum: ['streaming', 'utilities', 'data', 'insurance', 'gym', 'software', 'other'],
    required: true 
  },
  
  // Cost
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  // Billing cycle
  billingCycle: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Next billing date
  nextBillingDate: { type: Date, required: true },
  lastBillingDate: Date,
  lastBilledAmount: Number,
  
  // Auto-renewal
  autoRenew: { type: Boolean, default: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active' 
  },
  
  // Payment method
  paymentMethod: String, // Card, Bank transfer, Wallet
  
  // Reminder settings
  remindDaysBefore: { type: Number, default: 3 },
  remindEnabled: { type: Boolean, default: true },
  
  // Total spent on this subscription
  totalSpent: { type: Number, default: 0 },
  
  // Notes
  notes: String,
  
  // URL for logo/icon
  logoUrl: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for days until next billing
subscriptionSchema.virtual('daysUntilBilling').get(function() {
  const now = new Date();
  const next = new Date(this.nextBillingDate);
  const diffTime = next - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for monthly cost normalized
subscriptionSchema.virtual('monthlyCost').get(function() {
  const cycle = this.billingCycle;
  const amount = this.amount;
  
  switch(cycle) {
    case 'daily': return amount * 30;
    case 'weekly': return amount * 4;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'yearly': return amount / 12;
    default: return amount;
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

