const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getProvider } = require('../services/payments');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'email virtualAccountNumber virtualAccountBank firstName lastName'
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.virtualAccountNumber) {
      const provider = getProvider();
      if (provider.createVirtualAccount) {
        const virtualAccount = await provider.createVirtualAccount({
          userId: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        });

        if (virtualAccount?.success && virtualAccount.accountNumber) {
          user.virtualAccountNumber = String(virtualAccount.accountNumber);
          user.virtualAccountBank = virtualAccount.accountBank || user.virtualAccountBank || 'Monnify Settlement Bank';
          await user.save();
        }
      }
    }

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
