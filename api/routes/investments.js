const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const auth = require('../middleware/auth');

// Get all investments
router.get('/', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId, status: { $ne: 'liquidated' } })
      .sort({ createdAt: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single investment
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.userId });
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create investment
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, platform, accountNumber, investedAmount, currentValue, currency, exchangeRate, purchaseDate, purchasePrice, notes } = req.body;
    
    const investment = new Investment({
      userId: req.userId,
      name,
      type,
      platform,
      accountNumber,
      investedAmount,
      currentValue: currentValue || investedAmount,
      currency: currency || 'NGN',
      exchangeRate: exchangeRate || 1,
      purchaseDate,
      purchasePrice: purchasePrice || investedAmount,
      notes,
      lastUpdated: new Date()
    });
    
    // Calculate returns
    investment.calculateReturns();
    
    // Add to value history
    investment.valueHistory.push({
      value: currentValue || investedAmount,
      date: new Date()
    });
    
    await investment.save();
    res.status(201).json(investment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update investment (e.g., after price change)
router.put('/:id', auth, async (req, res) => {
  try {
    const { currentValue, notes } = req.body;
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    if (currentValue !== undefined) {
      investment.currentValue = currentValue;
      investment.calculateReturns();
      investment.lastUpdated = new Date();
      
      // Add to value history
      investment.valueHistory.push({
        value: currentValue,
        date: new Date()
      });
    }
    
    if (notes !== undefined) {
      investment.notes = notes;
    }
    
    await investment.save();
    res.json(investment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sell/liquidate investment
router.post('/:id/sell', auth, async (req, res) => {
  try {
    const { sellPrice, sellDate, notes } = req.body;
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    investment.status = 'sold';
    investment.currentValue = sellPrice || investment.currentValue;
    investment.calculateReturns();
    
    if (notes) {
      investment.notes = (investment.notes || '') + '\nSold: ' + notes;
    }
    
    await investment.save();
    res.json(investment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete investment
router.delete('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get portfolio summary
router.get('/stats/portfolio', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId, status: 'active' });
    
    const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalReturns = totalCurrentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    // Group by type
    const byType = {};
    investments.forEach(i => {
      if (!byType[i.type]) {
        byType[i.type] = { totalInvested: 0, totalValue: 0 };
      }
      byType[i.type].totalInvested += i.investedAmount;
      byType[i.type].totalValue += i.currentValue;
    });
    
    res.json({
      totalInvested,
      totalCurrentValue,
      totalReturns,
      returnsPercentage: returnsPercentage.toFixed(2),
      byType,
      count: investments.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

