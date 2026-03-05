const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'virtualAccountNumber virtualAccountBank firstName lastName'
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

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
