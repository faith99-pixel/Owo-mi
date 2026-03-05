const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.post('/goals', auth, async (req, res) => {
  try {
    const { title, targetAmount, emoji, isLocked, unlockDate } = req.body;
    const numericTarget = Number(targetAmount);

    if (!title || !numericTarget || numericTarget <= 0) {
      return res.status(400).json({ error: 'title and targetAmount are required' });
    }

    const goal = await SavingsGoal.create({
      userId: req.userId,
      title,
      targetAmount: numericTarget,
      emoji: emoji || 'TARGET',
      isLocked: Boolean(isLocked),
      unlockDate: unlockDate || null
    });

    res.status(201).json({ id: goal._id, message: 'Goal created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/goals', auth, async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/goals/:id/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.walletBalance < numericAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const walletBefore = user.walletBalance;
    const goalBefore = goal.currentAmount;

    user.walletBalance -= numericAmount;
    user.savingsBalance += numericAmount;
    goal.currentAmount += numericAmount;

    await user.save();
    await goal.save();

    await Transaction.create({
      userId: user._id,
      type: 'debit',
      amount: numericAmount,
      category: 'SAVINGS',
      description: `Added to ${goal.title}`,
      reference: `SAV-${Date.now()}`,
      balanceBefore: walletBefore,
      balanceAfter: user.walletBalance
    });

    if (goal.currentAmount >= goal.targetAmount && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      await goal.save();
    }

    res.json({
      message: 'Money added to savings',
      goalBalanceBefore: goalBefore,
      newCurrentAmount: goal.currentAmount,
      newWalletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/goals/:id/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.isLocked && goal.unlockDate && new Date(goal.unlockDate) > new Date()) {
      return res.status(400).json({ error: 'Goal is still locked' });
    }

    if (goal.currentAmount < numericAmount) {
      return res.status(400).json({ error: 'Insufficient savings balance' });
    }

    const walletBefore = user.walletBalance;
    goal.currentAmount -= numericAmount;
    user.walletBalance += numericAmount;
    user.savingsBalance = Math.max(0, user.savingsBalance - numericAmount);

    await goal.save();
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: numericAmount,
      category: 'WITHDRAWAL',
      description: `Withdrawn from ${goal.title}`,
      reference: `WDR-${Date.now()}`,
      balanceBefore: walletBefore,
      balanceAfter: user.walletBalance
    });

    res.json({
      message: 'Money withdrawn from savings',
      newCurrentAmount: goal.currentAmount,
      newWalletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
