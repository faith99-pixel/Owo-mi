const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Goal type
  goalType: { 
    type: String, 
    enum: ['savings', 'sinking_fund', 'wedding', 'emergency', 'investment', 'debt_payoff', 'purchase', 'event', 'other'],
    required: true 
  },
  
  // Goal details
  title: { type: String, required: true },
  description: String,
  emoji: { type: String, default: '🎯' },
  
  // Target
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  
  // Currency
  currency: { type: String, default: 'NGN' },
  
  // Timeline
  targetDate: Date,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active' 
  },
  
  // Milestones (auto-generated and custom)
  milestones: [{
    title: String,
    targetAmount: Number,
    achievedAt: Date,
    isAchieved: { type: Boolean, default: false }
  }],
  
  // Auto-celebrate milestone achievements
  celebrateMilestones: { type: Boolean, default: true },
  
  // Priority (1 = highest)
  priority: { type: Number, default: 3 },
  
  // Category tag
  category: String,
  
  // Linked savings goal (if applicable)
  linkedSavingsGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal' },
  
  // Progress history for tracking
  progressHistory: [{
    amount: Number,
    date: Date,
    note: String
  }]
});

financialGoalSchema.index({ userId: 1, status: 1 });
financialGoalSchema.index({ targetDate: 1 });

// Virtual for progress percentage
financialGoalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

// Virtual for days remaining
financialGoalSchema.virtual('daysRemaining').get(function() {
  if (!this.targetDate) return null;
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for suggested weekly contribution
financialGoalSchema.virtual('suggestedWeekly').get(function() {
  const days = this.daysRemaining;
  if (!days || days <= 0) return this.targetAmount - this.currentAmount;
  const remaining = this.targetAmount - this.currentAmount;
  return Math.ceil(remaining / (days / 7));
});

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);

