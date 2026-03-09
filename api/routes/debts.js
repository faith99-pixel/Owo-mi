const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');

// Get all debts for user
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single debt
router.get('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new debt
router.post('/', auth, async (req, res) => {
  try {
    const { debtType, name, phone, email, originalAmount, interestRate, dueDate, category, notes, remindEnabled, remindAfterDays } = req.body;
    
    const debt = new Debt({
      userId: req.userId,
      debtType,
      name,
      phone,
      email,
      originalAmount,
      remainingAmount: originalAmount,
      interestRate: interestRate || 0,
      dueDate,
      category: category || 'personal',
      notes,
      remindEnabled: remindEnabled || false,
      remindAfterDays: remindAfterDays || 7
    });
    
    await debt.save();
    res.status(201).json(debt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update debt
router.put('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    res.json(debt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record a payment
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    
    // Add payment to history
    debt.payments.push({
      amount,
      date: new Date(),
      note
    });
    
    // Update remaining amount
    debt.remainingAmount = Math.max(0, debt.remainingAmount - amount);
    
    // Update status
    if (debt.remainingAmount === 0) {
      debt.status = 'settled';
    } else if (debt.payments.length > 0) {
      debt.status = 'partial';
    }
    
    // Check if overdue
    if (debt.dueDate && new Date() > debt.dueDate && debt.remainingAmount > 0) {
      debt.status = 'overdue';
    }
    
    await debt.save();
    res.json(debt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete debt
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get debt summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.userId });
    
    const owedToMe = debts
      .filter(d => d.debtType === 'owed_to_me' && d.status !== 'settled')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
    
    const iOwe = debts
      .filter(d => d.debtType === 'i_owe' && d.status !== 'settled')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
    
    const overdueDebts = debts.filter(d => d.status === 'overdue').length;
    const settledDebts = debts.filter(d => d.status === 'settled').length;
    
    res.json({
      totalDebts: debts.length,
      owedToMe,
      iOwe,
      netPosition: owedToMe - iOwe,
      overdueDebts,
      settledDebts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

