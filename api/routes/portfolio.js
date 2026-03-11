const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');

// ============ INVESTMENTS ROUTES ============

// Get all investments
router.get('/investments', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create investment
router.post('/investments', auth, async (req, res) => {
  try {
    const { name, type, amount, purchasePrice, currentPrice, quantity, purchaseDate } = req.body;
    const investment = await Investment.create({
      userId: req.userId,
      name,
      type,
      amount: Number(amount),
      purchasePrice: Number(purchasePrice),
      currentPrice: Number(currentPrice) || Number(purchasePrice),
      quantity: Number(quantity) || 1,
      purchaseDate
    });
    res.status(201).json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update investment
router.put('/investments/:id', auth, async (req, res) => {
  try {
    const { currentPrice, status } = req.body;
    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        ...(currentPrice && { currentPrice: Number(currentPrice) }),
        ...(status && { status })
      },
      { new: true }
    );
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete investment
router.delete('/investments/:id', auth, async (req, res) => {
  try {
    await Investment.findByIdAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Investment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ INVOICES ROUTES ============

// Get all invoices
router.get('/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/invoices', auth, async (req, res) => {
  try {
    const { title, clientName, clientEmail, clientPhone, items, tax, discount, total, dueDate, notes } = req.body;
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      userId: req.userId,
      title,
      clientName,
      clientEmail,
      clientPhone,
      items,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      total: Number(total),
      dueDate,
      notes,
      invoiceNumber
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark invoice as paid
router.put('/invoices/:id/paid', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/invoices/:id', auth, async (req, res) => {
  try {
    await Invoice.findByIdAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ UTILITY ROUTES ============

// Get utility data
router.get('/utility', auth, async (req, res) => {
  try {
    res.json({ 
      message: 'Utility endpoint',
      features: ['bank-list', 'exchange-rates', 'calculators']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List banks (for funding)
router.get('/utility/banks', auth, async (req, res) => {
  try {
    const banks = [
      { code: '044', name: 'Access Bank' },
      { code: '023', name: 'Citibank Nigeria' },
      { code: '050', name: 'Ecobank Nigeria' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '214', name: 'First City Monument Bank (FCMB)' },
      { code: '00103', name: 'Globus Bank' },
      { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
      { code: '072', name: 'Heritage Bank' },
      { code: '065', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '090267', name: 'Kuda Bank' },
      { code: '50515', name: 'Moniepoint MFB' },
      { code: '100004', name: 'Opay' },
      { code: '125', name: 'Parallex Bank' },
      { code: '076', name: 'Polaris Bank' },
      { code: '046', name: 'PremiumTrust Bank' },
      { code: '101', name: 'Providus Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered Nigeria' },
      { code: '232', name: 'Sterling Bank' },
      { code: '100', name: 'SunTrust Bank Nigeria' },
      { code: '090591', name: 'Titan Trust Bank' },
      { code: '032', name: 'Union Bank of Nigeria' },
      { code: '033', name: 'United Bank for Africa (UBA)' },
      { code: '153', name: 'Unity Bank' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' }
    ];
    res.json({ banks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve bank account
router.post('/utility/resolve-account', auth, async (req, res) => {
  try {
    const { bankCode, accountNumber } = req.body;
    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      return res.status(400).json({ error: 'Invalid bank code or account number' });
    }
    res.json({ 
      accountName: `Demo Account ${accountNumber.slice(-4)}`,
      accountNumber 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

