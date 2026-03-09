const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Debt type: owed_to_me (someone owes me), i_owe (I owe someone)
  debtType: { 
    type: String, 
    enum: ['owed_to_me', 'i_owe'], 
    required: true 
  },
  
  // Person details
  name: { type: String, required: true },
  phone: String,
  email: String,
  
  // Amount
  originalAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  
  // Currency
  currency: { type: String, default: 'NGN' },
  
  // Terms
  interestRate: { type: Number, default: 0 }, // Annual interest rate %
  dueDate: Date,
  isInterestCalculated: { type: Boolean, default: false },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'partial', 'settled', 'overdue'], 
    default: 'active' 
  },
  
  // Payment history
  payments: [{
    amount: Number,
    date: Date,
    note: String
  }],
  
  // Category
  category: { 
    type: String, 
    enum: ['personal', 'business', 'family', 'friend', 'loan', 'other'],
    default: 'personal'
  },
  
  // Notes
  notes: String,
  
  // Reminder settings
  remindEnabled: { type: Boolean, default: false },
  remindAfterDays: { type: Number, default: 7 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Debt', debtSchema);

