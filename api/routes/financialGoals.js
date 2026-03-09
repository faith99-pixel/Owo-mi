const express = require('express');
const router = express.Router();
const FinancialGoal = require('../models/FinancialGoal');
const auth = require('../middleware/auth');

// Get all financial goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ userId: req.userId, status: { $ne: 'cancelled' } })
      .sort({ priority: 1, createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single goal
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await FinancialGoal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new goal
router.post('/', auth, async (req, res) => {
  try {
    const { goalType, title, description, emoji, targetAmount, targetDate, category, priority } = req.body;
    
    // Auto-generate milestones based on target amount
    const milestones = [];
    if (targetAmount) {
      const milestoneCount = Math.min(5, Math.max(2, Math.floor(targetAmount / 50000)));
      const milestoneStep = targetAmount / milestoneCount;
      for (let i = 1; i <= milestoneCount; i++) {
        milestones.push({
          title: `${Math.round((i / milestoneCount) * 100)}% milestone`,
          targetAmount: Math.round(milestoneStep * i),
          isAchieved: false
        });
      }
    }
    
    const goal = new FinancialGoal({
      userId: req.userId,
      goalType: goalType || 'savings',
      title,
      description,
      emoji: emoji || '🎯',
      targetAmount,
      currentAmount: 0,
      targetDate,
      category,
      priority: priority || 3,
      milestones
    });
    
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update goal
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await FinancialGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add money to goal
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const goal = await FinancialGoal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Update amount
    goal.currentAmount = (goal.currentAmount || 0) + amount;
    
    // Add to progress history
    goal.progressHistory.push({
      amount,
      date: new Date(),
      note
    });
    
    // Check and update milestones
    const previousMilestone = goal.milestones.filter(m => m.isAchieved).length;
    goal.milestones.forEach(milestone => {
      if (!milestone.isAchieved && goal.currentAmount >= milestone.targetAmount) {
        milestone.isAchieved = true;
        milestone.achievedAt = new Date();
      }
    });
    const currentMilestone = goal.milestones.filter(m => m.isAchieved).length;
    const newMilestoneReached = currentMilestone > previousMilestone;
    
    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    res.json({
      goal,
      milestoneReached: newMilestoneReached,
      reachedMilestone: newMilestoneReached ? goal.milestones[currentMilestone - 1] : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Withdraw from goal
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const goal = await FinancialGoal.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    if (amount > goal.currentAmount) {
      return res.status(400).json({ error: 'Insufficient funds in goal' });
    }
    
    goal.currentAmount -= amount;
    
    // Add to progress history as negative
    goal.progressHistory.push({
      amount: -amount,
      date: new Date(),
      note: note || 'Withdrawal'
    });
    
    // If goal was completed, mark as active again
    if (goal.status === 'completed') {
      goal.status = 'active';
      goal.completedAt = null;
    }
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await FinancialGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get goals summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ userId: req.userId, status: { $ne: 'cancelled' } });
    
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    
    // Goals due soon (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dueSoon = activeGoals.filter(g => g.targetDate && new Date(g.targetDate) <= thirtyDaysFromNow);
    
    res.json({
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTarget,
      totalSaved,
      totalRemaining: totalTarget - totalSaved,
      dueSoon: dueSoon.length,
      overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

