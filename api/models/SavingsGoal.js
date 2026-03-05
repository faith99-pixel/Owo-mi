const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  emoji: { type: String, default: '🎯' },
  
  // Lock settings
  isLocked: { type: Boolean, default: false },
  unlockDate: Date,
  
  // Interest
  interestRate: { type: Number, default: 10 }, // 10% per annum
  
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

savingsGoalSchema.virtual('progress').get(function() {
  return (this.currentAmount / this.targetAmount) * 100;
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
