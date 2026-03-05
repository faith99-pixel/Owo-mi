const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get virtual account details
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT virtualAccountNumber, virtualAccountBank, firstName, lastName FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    
    res.json({
      accountNumber: user.virtualAccountNumber,
      accountBank: user.virtualAccountBank,
      accountName: `${user.firstName} ${user.lastName}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
