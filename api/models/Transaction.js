const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  
  category: { 
    type: String, 
    enum: ['TRANSPORT', 'FOOD', 'AIRTIME', 'DATA', 'BETTING', 'POS', 'SHOPPING', 'ENTERTAINMENT', 'TRANSFER', 'SAVINGS', 'WITHDRAWAL'],
    default: 'TRANSFER'
  },
  
  description: String,
  merchant: String,
  
  // For P2P transfers
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Payment reference
  reference: { type: String, unique: true },
  
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  channel: { type: String, enum: ['wallet', 'bank_transfer', 'sms_import'], default: 'wallet' },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
  provider: String,
  providerReference: String,
  bankCode: String,
  bankName: String,
  accountNumber: String,
  accountName: String,
  
  balanceBefore: Number,
  balanceAfter: Number,
  
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
