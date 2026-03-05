const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Create savings goal
router.post('/goals', auth, async (req, res) => {
  try {
    const { title, targetAmount, emoji, isLocked, unlockDate } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO savings_goals (userId, title, targetAmount, emoji, isLocked, unlockDate) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, title, targetAmount, emoji || '🎯', isLocked ? 1 : 0, unlockDate]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Goal created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all savings goals
router.get('/goals', auth, async (req, res) => {
  try {
    const [goals] = await db.query('SELECT * FROM savings_goals WHERE userId = ? ORDER BY createdAt DESC', [req.userId]);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add money to savings goal
router.post('/goals/:id/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const goalId = req.params.id;
    
    const [users] = await db.query('SELECT walletBalance FROM users WHERE id = ?', [req.userId]);
    const walletBalance = parseFloat(users[0].walletBalance);
    
    if (walletBalance < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    
    const [goals] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND userId = ?', [goalId, req.userId]);
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = goals[0];
    const newCurrentAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
    const newWalletBalance = walletBalance - parseFloat(amount);
    const newSavingsBalance = parseFloat(users[0].savingsBalance || 0) + parseFloat(amount);
    
    await db.query('UPDATE savings_goals SET currentAmount = ? WHERE id = ?', [newCurrentAmount, goalId]);
    await db.query('UPDATE users SET walletBalance = ?, savingsBalance = ? WHERE id = ?', [newWalletBalance, newSavingsBalance, req.userId]);
    
    const reference = 'SAV-' + Date.now();
    await db.query(
      'INSERT INTO transactions (userId, type, amount, category, description, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, 'debit', amount, 'SAVINGS', `Added to ${goal.title}`, reference, walletBalance, newWalletBalance, 'savings']
    );
    
    res.json({ message: 'Money added to savings', newCurrentAmount, newWalletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Withdraw from savings goal
router.post('/goals/:id/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const goalId = req.params.id;
    
    const [goals] = await db.query('SELECT * FROM savings_goals WHERE id = ? AND userId = ?', [goalId, req.userId]);
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = goals[0];
    if (parseFloat(goal.currentAmount) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient savings balance' });
    }
    
    const [users] = await db.query('SELECT walletBalance, savingsBalance FROM users WHERE id = ?', [req.userId]);
    const walletBalance = parseFloat(users[0].walletBalance);
    const savingsBalance = parseFloat(users[0].savingsBalance);
    
    const newCurrentAmount = parseFloat(goal.currentAmount) - parseFloat(amount);
    const newWalletBalance = walletBalance + parseFloat(amount);
    const newSavingsBalance = savingsBalance - parseFloat(amount);
    
    await db.query('UPDATE savings_goals SET currentAmount = ? WHERE id = ?', [newCurrentAmount, goalId]);
    await db.query('UPDATE users SET walletBalance = ?, savingsBalance = ? WHERE id = ?', [newWalletBalance, newSavingsBalance, req.userId]);
    
    const reference = 'WDR-' + Date.now();
    await db.query(
      'INSERT INTO transactions (userId, type, amount, category, description, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, 'credit', amount, 'WITHDRAWAL', `Withdrawn from ${goal.title}`, reference, walletBalance, newWalletBalance, 'savings']
    );
    
    res.json({ message: 'Money withdrawn from savings', newCurrentAmount, newWalletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
