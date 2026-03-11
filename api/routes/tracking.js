const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const Subscription = require('../models/Subscription');
const SinkingFund = require('../models/SinkingFund');
const BudgetCap = require('../models/BudgetCap');
const auth = require('../middleware/auth');

// ============ DEBTS ROUTES ============

// Get all debts
router.get('/debts', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.userId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create debt
router.post('/debts', auth, async (req, res) => {
  try {
    const { name, amount, debtType, phone } = req.body;
    const debt = await Debt.create({
      userId: req.userId,
      name,
      amount: Number(amount),
      debtType,
      phone
    });
    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update debt
router.put('/debts/:id', auth, async (req, res) => {
  try {
    const { paidAmount } = req.body;
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) return res.status(404).json({ error: 'Debt not found' });
    
    debt.paidAmount = (debt.paidAmount || 0) + (Number(paidAmount) || 0);
    if (debt.paidAmount >= debt.amount) {
      debt.status = 'settled';
    }
    await debt.save();
    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete debt
router.delete('/debts/:id', auth, async (req, res) => {
  try {
    await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SUBSCRIPTIONS ROUTES ============

// Get all subscriptions
router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId, status: { $ne: 'cancelled' } }).sort({ nextBillingDate: 1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/subscriptions', auth, async (req, res) => {
  try {
    const { name, amount, billingCycle, nextBillingDate } = req.body;
    const subscription = await Subscription.create({
      userId: req.userId,
      name,
      amount: Number(amount),
      billingCycle,
      nextBillingDate
    });
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.delete('/subscriptions/:id', auth, async (req, res) => {
  try {
    await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SINKING FUNDS ROUTES ============

// Get all sinking funds
router.get('/sinking-funds', auth, async (req, res) => {
  try {
    const funds = await SinkingFund.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(funds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sinking fund
router.post('/sinking-funds', auth, async (req, res) => {
  try {
    const { name, targetAmount, emoji, category } = req.body;
    const fund = await SinkingFund.create({
      userId: req.userId,
      name,
      targetAmount: Number(targetAmount),
      emoji: emoji || 'FUND',
      category: category || 'emergency'
    });
    res.status(201).json(fund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to sinking fund
router.post('/sinking-funds/:id/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const fund = await SinkingFund.findOne({ _id: req.params.id, userId: req.userId });
    if (!fund) return res.status(404).json({ error: 'Fund not found' });
    
    fund.currentAmount = (fund.currentAmount || 0) + Number(amount);
    if (fund.currentAmount >= fund.targetAmount) {
      fund.status = 'completed';
    }
    await fund.save();
    res.json(fund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete sinking fund
router.delete('/sinking-funds/:id', auth, async (req, res) => {
  try {
    await SinkingFund.findByIdAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Sinking fund deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BUDGET CAPS ROUTES ============

// Get all budget caps
router.get('/budget-caps', auth, async (req, res) => {
  try {
    const caps = await BudgetCap.find({ userId: req.userId, status: { $ne: 'deleted' } });
    res.json(caps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget cap
router.post('/budget-caps', auth, async (req, res) => {
  try {
    const { category, limit, period } = req.body;
    const cap = await BudgetCap.create({
      userId: req.userId,
      category,
      limit: Number(limit),
      period: period || 'weekly'
    });
    res.status(201).json(cap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update budget cap
router.put('/budget-caps/:id', auth, async (req, res) => {
  try {
    const { limit, status } = req.body;
    const cap = await BudgetCap.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...(limit && { limit: Number(limit) }), ...(status && { status }) },
      { new: true }
    );
    res.json(cap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete budget cap
router.delete('/budget-caps/:id', auth, async (req, res) => {
  try {
    await BudgetCap.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'deleted' },
      { new: true }
    );
    res.json({ message: 'Budget cap deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

