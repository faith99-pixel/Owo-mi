const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// Get all subscriptions
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId, status: { $ne: 'cancelled' } })
      .sort({ nextBillingDate: 1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single subscription
router.get('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.userId });
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/', auth, async (req, res) => {
  try {
    const { name, provider, category, amount, billingCycle, nextBillingDate, autoRenew, paymentMethod, remindDaysBefore, notes, logoUrl } = req.body;
    
    const subscription = new Subscription({
      userId: req.userId,
      name,
      provider,
      category,
      amount,
      billingCycle: billingCycle || 'monthly',
      nextBillingDate,
      autoRenew: autoRenew !== false,
      paymentMethod,
      remindDaysBefore: remindDaysBefore || 3,
      remindEnabled: true,
      notes,
      logoUrl
    });
    
    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update subscription
router.put('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record billing (auto-update next billing date)
router.post('/:id/billed', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Update billing info
    subscription.lastBillingDate = subscription.nextBillingDate;
    subscription.lastBilledAmount = subscription.amount;
    subscription.totalSpent = (subscription.totalSpent || 0) + subscription.amount;
    
    // Calculate next billing date
    const current = new Date(subscription.nextBillingDate);
    switch (subscription.billingCycle) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
    subscription.nextBillingDate = current;
    
    await subscription.save();
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel subscription
router.delete('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get subscriptions due soon
router.get('/stats/due-soon', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ 
      userId: req.userId, 
      status: 'active',
      nextBillingDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // Due within 7 days
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId, status: { $ne: 'cancelled' } });
    
    const active = subscriptions.filter(s => s.status === 'active');
    const totalMonthly = active.reduce((sum, s) => sum + (s.monthlyCost || s.amount), 0);
    const totalYearly = totalMonthly * 12;
    const totalSpent = subscriptions.reduce((sum, s) => sum + (s.totalSpent || 0), 0);
    
    // Due soon
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = active.filter(s => new Date(s.nextBillingDate) <= sevenDays);
    
    res.json({
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: active.length,
      totalMonthly,
      totalYearly,
      totalSpent,
      dueSoon: dueSoon.length,
      dueSoonAmount: dueSoon.reduce((sum, s) => sum + s.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

