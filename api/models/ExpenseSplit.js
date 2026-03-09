const mongoose = require('mongoose');

const expenseSplitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  // Split type: equal, percentage, custom
  splitType: { 
    type: String, 
    enum: ['equal', 'percentage', 'custom'], 
    default: 'equal' 
  },
  
  // Participants in the split
  participants: [{
    name: String,
    email: String,
    phone: String,
    shareAmount: Number,
    sharePercentage: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date
  }],
  
  // Who created this split (owner)
  ownerName: String,
  
  // Status: active, settled, deleted
  status: { 
    type: String, 
    enum: ['active', 'settled', 'deleted'], 
    default: 'active' 
  },
  
  // Category for the expense
  category: { 
    type: String, 
    enum: ['food', 'transport', 'entertainment', 'shopping', 'rent', 'utilities', 'travel', 'events', 'business', 'other'],
    default: 'other'
  },
  
  // Due date for settlement
  dueDate: Date,
  
  // Related transaction (optional)
  linkedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  // Settlement details
  settledAt: Date,
  settledBy: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

expenseSplitSchema.index({ userId: 1, status: 1 });
expenseSplitSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ExpenseSplit', expenseSplitSchema);

