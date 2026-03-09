const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Invoice details
  invoiceNumber: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "Freelance Design Services"
  
  // Client details
  clientName: { type: String, required: true },
  clientEmail: String,
  clientPhone: String,
  clientAddress: String,
  
  // Invoice items
  items: [{
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    total: Number
  }],
  
  // Totals
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  
  // Dates
  issueDate: { type: Date, default: Date.now },
  dueDate: Date,
  paidDate: Date,
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  
  // Notes
  notes: String,
  terms: String,
  
  // Payment info
  paymentInstructions: String,
  
  // PDF/Export
  pdfUrl: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });

// Generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(userId) {
  const count = await this.countDocuments({ userId });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Invoice', invoiceSchema);

