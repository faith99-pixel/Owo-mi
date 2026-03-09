const express = require('express');
const router = express.Router();
const SinkingFund = require('../models/SinkingFund');
const auth = require('../middleware/auth');

// Get all sinking funds
router.get('/', auth, async (req, res) => {
  try {
    const funds = await SinkingFund.find({ userId: req.userId, status: { $ne: 'expired' } })
      .sort({ nextDueDate: 1 });
    res.json(funds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single fund
router.get('/:id', auth, async (req, res) => {
  try {
    const fund = await SinkingFund.findOne({ _id: req.params.id, userId: req.userId });
    if (!fund) {
      return res.status(404).json({ error: 'Sinking fund not found' });
    }
    res.json(fund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new sinking fund
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, emoji, targetAmount, frequency, nextDueDate, category } = req.body;
    
    // Calculate monthly contribution needed
    let monthlyContribution = 0;
    if (targetAmount && nextDueDate) {
      const now = new Date();
      const due = new Date(nextDueDate);
      const monthsUntilDue = (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth());
      if (monthsUntilDue > 0) {
        monthlyContribution = Math.ceil(targetAmount / monthsUntilDue);
      }
    }
    
    const fund = new SinkingFund({
      userId: req.userId,
      name,
      description,
      emoji: emoji || '🏦',
      targetAmount,
      currentAmount: 0,
      frequency,
      nextDueDate,
      category: category || 'other',
      monthlyContribution
    });
    
    await fund.save();
    res.status(201).json(fund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update fund
router.put('/:id', auth, async (req, res) => {
  try {
    const fund = await SinkingFund.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!fund) {
      return res.status(404).json({ error: 'Sinking fund not found' });
    }
    res.json(fund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add contribution
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const fund = await SinkingFund.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!fund) {
      return res.status(404).json({ error: 'Sinking fund not found' });
    }
    
    fund.currentAmount += amount;
    fund.contributions.push({
      amount,
      date: new Date(),
      note
    });
    
    // If target reached, mark as completed
    if (fund.currentAmount >= fund.targetAmount && fund.status === 'active') {
      fund.status = 'completed';
    }
    
    await fund.save();
    res.json(fund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record withdrawal/usage
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const fund = await SinkingFund.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!fund) {
      return res.status(404).json({ error: 'Sinking fund not found' });
    }
    
    if (amount > fund.currentAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    fund.currentAmount -= amount;
    fund.withdrawals.push({
      amount,
      date: new Date(),
      note
    });
    
    // Reset for next cycle if annual
    if (fund.frequency === 'annual' && fund.currentAmount < fund.targetAmount * 0.2) {
      fund.status = 'active';
    }
    
    await fund.save();
    res.json(fund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete fund
router.delete('/:id', auth, async (req, res) => {
  try {
    const fund = await SinkingFund.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!fund) {
      return res.status(404).json({ error: 'Sinking fund not found' });
    }
    res.json({ message: 'Sinking fund deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const funds = await SinkingFund.find({ userId: req.userId, status: { $ne: 'expired' } });
    
    const totalTarget = funds.reduce((sum, f) => sum + f.targetAmount, 0);
    const totalSaved = funds.reduce((sum, f) => sum + f.currentAmount, 0);
    
    // Due this month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueThisMonth = funds.filter(f => new Date(f.nextDueDate) <= endOfMonth && f.status === 'active');
    
    res.json({
      totalFunds: funds.length,
      totalTarget,
      totalSaved,
      totalRemaining: totalTarget - totalSaved,
      dueThisMonth: dueThisMonth.length,
      dueThisMonthAmount: dueThisMonth.reduce((sum, f) => sum + (f.targetAmount - f.currentAmount), 0),
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

