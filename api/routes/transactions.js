const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get transaction history
router.get('/', auth, async (req, res) => {
  try {
    const [transactions] = await db.query('SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 100', [req.userId]);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get spending insights
router.get('/insights', auth, async (req, res) => {
  try {
    const [categorySpending] = await db.query(
      'SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE userId = ? AND type = ? GROUP BY category ORDER BY total DESC',
      [req.userId, 'debit']
    );
    
    const [totalSpent] = await db.query(
      'SELECT SUM(amount) as total FROM transactions WHERE userId = ? AND type = ?',
      [req.userId, 'debit']
    );
    
    const [recentTransactions] = await db.query(
      'SELECT * FROM transactions WHERE userId = ? AND type = ? ORDER BY createdAt DESC LIMIT 10',
      [req.userId, 'debit']
    );
    
    res.json({
      categorySpending: categorySpending.map(c => ({ ...c, total: parseFloat(c.total) })),
      totalSpent: parseFloat(totalSpent[0]?.total || 0),
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
