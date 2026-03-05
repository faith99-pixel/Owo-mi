const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT walletBalance, savingsBalance FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    
    res.json({
      walletBalance: parseFloat(user.walletBalance),
      savingsBalance: parseFloat(user.savingsBalance),
      totalBalance: parseFloat(user.walletBalance) + parseFloat(user.savingsBalance)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fund wallet
router.post('/fund', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    const [users] = await db.query('SELECT walletBalance FROM users WHERE id = ?', [req.userId]);
    const balanceBefore = parseFloat(users[0].walletBalance);
    const balanceAfter = balanceBefore + parseFloat(amount);
    
    await db.query('UPDATE users SET walletBalance = ? WHERE id = ?', [balanceAfter, req.userId]);
    
    const reference = 'FUND-' + Date.now();
    await db.query(
      'INSERT INTO transactions (userId, type, amount, category, description, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, 'credit', amount, 'FUNDING', 'Wallet funding', reference, balanceBefore, balanceAfter, 'wallet']
    );
    
    res.json({ message: 'Wallet funded', newBalance: balanceAfter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import SMS transactions
router.post('/import-sms', auth, async (req, res) => {
  try {
    const { transactions } = req.body;
    
    const [users] = await db.query('SELECT walletBalance FROM users WHERE id = ?', [req.userId]);
    let balance = parseFloat(users[0].walletBalance);
    
    for (const tx of transactions) {
      const balanceBefore = balance;
      balance -= parseFloat(tx.amount);
      
      const reference = 'SMS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      await db.query(
        'INSERT INTO transactions (userId, type, amount, category, description, merchant, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.userId, 'debit', tx.amount, tx.category, tx.rawMessage, tx.merchant, reference, balanceBefore, balance, 'sms_import']
      );
    }
    
    await db.query('UPDATE users SET walletBalance = ? WHERE id = ?', [balance, req.userId]);
    
    res.json({ message: 'Transactions imported', newBalance: balance, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// P2P Transfer
router.post('/transfer', auth, async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;
    
    const [senders] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    const [recipients] = await db.query('SELECT * FROM users WHERE email = ?', [recipientEmail]);
    
    if (recipients.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    const sender = senders[0];
    const recipient = recipients[0];
    
    if (parseFloat(sender.walletBalance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const senderBalanceBefore = parseFloat(sender.walletBalance);
    const senderBalanceAfter = senderBalanceBefore - parseFloat(amount);
    const recipientBalanceBefore = parseFloat(recipient.walletBalance);
    const recipientBalanceAfter = recipientBalanceBefore + parseFloat(amount);
    
    await db.query('UPDATE users SET walletBalance = ? WHERE id = ?', [senderBalanceAfter, sender.id]);
    await db.query('UPDATE users SET walletBalance = ? WHERE id = ?', [recipientBalanceAfter, recipient.id]);
    
    const reference = 'TRF-' + Date.now();
    
    await db.query(
      'INSERT INTO transactions (userId, type, amount, category, description, recipientId, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [sender.id, 'debit', amount, 'TRANSFER', description || 'P2P Transfer', recipient.id, reference, senderBalanceBefore, senderBalanceAfter, 'wallet']
    );
    
    await db.query(
      'INSERT INTO transactions (userId, type, amount, category, description, senderId, reference, balanceBefore, balanceAfter, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [recipient.id, 'credit', amount, 'TRANSFER', description || 'P2P Transfer', sender.id, reference, recipientBalanceBefore, recipientBalanceAfter, 'wallet']
    );
    
    res.json({ message: 'Transfer successful', reference, newBalance: senderBalanceAfter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
