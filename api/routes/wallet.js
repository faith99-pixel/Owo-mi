const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      walletBalance: user.walletBalance,
      savingsBalance: user.savingsBalance,
      totalBalance: user.walletBalance + user.savingsBalance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fund', auth, async (req, res) => {
  try {
    const { amount, source } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balanceBefore = user.walletBalance;
    user.walletBalance += numericAmount;
    await user.save();

    const sourceLabel =
      source && typeof source === 'object'
        ? [source.bankName, source.last4 ? `**** ${source.last4}` : null].filter(Boolean).join(' ')
        : null;

    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: numericAmount,
      category: 'TRANSFER',
      description: sourceLabel ? `Wallet funding from ${sourceLabel}` : 'Wallet funding',
      merchant: source?.bankName || undefined,
      reference: `FUND-${Date.now()}`,
      balanceBefore,
      balanceAfter: user.walletBalance
    });

    res.json({ message: 'Wallet funded', newBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import-sms', auth, async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions array is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const docs = [];
    let runningBalance = user.walletBalance;

    transactions.forEach((tx, index) => {
      const debit = Number(tx.amount || 0);
      const before = runningBalance;
      runningBalance -= debit;

      docs.push({
        userId: user._id,
        type: 'debit',
        amount: debit,
        category: tx.category || 'TRANSFER',
        description: tx.rawMessage || 'Imported SMS transaction',
        merchant: tx.merchant,
        reference: `SMS-${Date.now()}-${index}`,
        balanceBefore: before,
        balanceAfter: runningBalance
      });
    });

    await Transaction.insertMany(docs);
    user.walletBalance = runningBalance;
    await user.save();

    res.json({
      message: 'Transactions imported',
      newBalance: runningBalance,
      count: docs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfer', auth, async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const sender = await User.findById(req.userId);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    if (sender.walletBalance < numericAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const senderBalanceBefore = sender.walletBalance;
    const recipientBalanceBefore = recipient.walletBalance;

    sender.walletBalance -= numericAmount;
    recipient.walletBalance += numericAmount;

    await sender.save();
    await recipient.save();

    const reference = `TRF-${Date.now()}`;
    await Transaction.create([
      {
        userId: sender._id,
        type: 'debit',
        amount: numericAmount,
        category: 'TRANSFER',
        description: description || `Transfer to ${recipient.firstName}`,
        recipientId: recipient._id,
        reference,
        balanceBefore: senderBalanceBefore,
        balanceAfter: sender.walletBalance
      },
      {
        userId: recipient._id,
        type: 'credit',
        amount: numericAmount,
        category: 'TRANSFER',
        description: description || `Transfer from ${sender.firstName}`,
        senderId: sender._id,
        reference: `${reference}-IN`,
        balanceBefore: recipientBalanceBefore,
        balanceAfter: recipient.walletBalance
      }
    ]);

    res.json({ message: 'Transfer successful', reference, newBalance: sender.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
