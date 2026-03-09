const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { title, clientName, clientEmail, clientPhone, clientAddress, items, tax, discount, dueDate, notes, terms, paymentInstructions } = req.body;
    
    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(req.userId);
    
    // Calculate totals
    const itemsWithTotals = items.map(item => ({
      ...item,
      total: (item.quantity || 1) * (item.unitPrice || 0)
    }));
    
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + (tax || 0) - (discount || 0);
    
    const invoice = new Invoice({
      userId: req.userId,
      invoiceNumber,
      title,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      items: itemsWithTotals,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      dueDate,
      notes,
      terms: terms || 'Payment due within 30 days',
      paymentInstructions: paymentInstructions || 'Transfer to account details provided separately'
    });
    
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as sent
router.post('/:id/send', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'sent', updatedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark as paid
router.post('/:id/paid', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'paid', paidDate: new Date(), updatedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice cancelled' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get invoice stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId });
    
    const total = invoices.reduce((sum, i) => sum + i.total, 0);
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => ['sent', 'viewed'].includes(i.status));
    const overdue = invoices.filter(i => i.status === 'overdue');
    
    const totalPaid = paid.reduce((sum, i) => sum + i.total, 0);
    const totalPending = pending.reduce((sum, i) => sum + i.total, 0);
    
    res.json({
      totalInvoices: invoices.length,
      paidInvoices: paid.length,
      pendingInvoices: pending.length,
      overdueInvoices: overdue.length,
      totalRevenue: totalPaid,
      totalPending,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

