const express = require('express');
const router = express.Router();
const BudgetCap = require('../models/BudgetCap');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get all budget caps
router.get('/', auth, async (req, res) => {
  try {
    const caps = await BudgetCap.find({ userId: req.userId, status: { $ne: 'paused' } });
    res.json(caps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single cap
router.get('/:id', auth, async (req, res) => {
  try {
    const cap = await BudgetCap.findOne({ _id: req.params.id, userId: req.userId });
    if (!cap) {
      return res.status(404).json({ error: 'Budget cap not found' });
    }
    res.json(cap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create budget cap
router.post('/', auth, async (req, res) => {
  try {
    const { category, limitAmount, period, alertThreshold } = req.body;
    
    // Calculate period dates
    const now = new Date();
    let periodStart, periodEnd;
    
    switch (period) {
      case 'daily':
        periodStart = new Date(now.setHours(0, 0, 0, 0));
        periodEnd = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        break;
      case 'monthly':
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
    }
    
    const cap = new BudgetCap({
      userId: req.userId,
      category,
      limitAmount,
      period: period || 'monthly',
      alertThreshold: alertThreshold || 80,
      periodStart,
      periodEnd,
      currentSpending: 0
    });
    
    await cap.save();
    res.status(201).json(cap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update budget cap
router.put('/:id', auth, async (req, res) => {
  try {
    const cap = await BudgetCap.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!cap) {
      return res.status(404).json({ error: 'Budget cap not found' });
    }
    res.json(cap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Refresh spending for a cap
router.post('/:id/refresh', auth, async (req, res) => {
  try {
    const cap = await BudgetCap.findOne({ _id: req.params.id, userId: req.userId });
    if (!cap) {
      return res.status(404).json({ error: 'Budget cap not found' });
    }
    
    // Get transactions in current period
    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'debit',
      category: cap.category,
      createdAt: { $gte: cap.periodStart, $lte: cap.periodEnd }
    });
    
    cap.currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Check if exceeded
    if (cap.currentSpending > cap.limitAmount) {
      cap.status = 'exceeded';
    } else {
      cap.status = 'active';
    }
    
    await cap.save();
    res.json(cap);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete cap
router.delete('/:id', auth, async (req, res) => {
  try {
    const cap = await BudgetCap.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!cap) {
      return res.status(404).json({ error: 'Budget cap not found' });
    }
    res.json({ message: 'Budget cap deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all caps with current spending
router.get('/stats/all', auth, async (req, res) => {
  try {
    const caps = await BudgetCap.find({ userId: req.userId });
    
    // Refresh each cap's current spending
    const now = new Date();
    const updatedCaps = await Promise.all(caps.map(async (cap) => {
      let periodStart, periodEnd;
      
      switch (cap.period) {
        case 'daily':
          periodStart = new Date(now.setHours(0, 0, 0, 0));
          periodEnd = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'weekly':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - now.getDay());
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodStart.getDate() + 6);
          break;
        case 'monthly':
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }
      
      const transactions = await Transaction.find({
        userId: req.userId,
        type: 'debit',
        category: cap.category,
        createdAt: { $gte: periodStart, $lte: periodEnd }
      });
      
      cap.currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
      cap.periodStart = periodStart;
      cap.periodEnd = periodEnd;
      
      if (cap.currentSpending > cap.limitAmount) {
        cap.status = 'exceeded';
      }
      
      await cap.save();
      return cap;
    }));
    
    res.json(updatedCaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

