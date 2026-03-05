const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/insights', auth, async (req, res) => {
  try {
    const debitTransactions = await Transaction.find({ userId: req.userId, type: 'debit' }).sort({ createdAt: -1 });

    const totalSpent = debitTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryMap = debitTransactions.reduce((acc, tx) => {
      const key = tx.category || 'TRANSFER';
      if (!acc[key]) acc[key] = { category: key, total: 0, count: 0 };
      acc[key].total += tx.amount;
      acc[key].count += 1;
      return acc;
    }, {});

    const categorySpending = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    res.json({
      categorySpending,
      totalSpent,
      recentTransactions: debitTransactions.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
