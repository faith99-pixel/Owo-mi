const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Transaction = require('../models/Transaction')
const auth = require('../middleware/auth')
const { getProvider } = require('../services/payments')

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

router.get('/banks', auth, async (req, res) => {
  try {
    const provider = getProvider()
    const banks = provider.listBanks()
    res.json({ provider: provider.key, banks })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/resolve-account', auth, async (req, res) => {
  try {
    const { bankCode, accountNumber } = req.body
    if (!bankCode || !accountNumber) {
      return res.status(400).json({ error: 'bankCode and accountNumber are required' })
    }

    const provider = getProvider()
    const result = await provider.resolveAccount({ bankCode, accountNumber })
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Unable to resolve account' })
    }

    res.json({
      bankCode,
      accountNumber,
      accountName: result.accountName
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/transfers', auth, async (req, res) => {
  try {
    const { bankCode, bankName, accountNumber, accountName, amount, narration } = req.body
    const numericAmount = toNumber(amount)

    if (!bankCode || !accountNumber || !accountName || numericAmount <= 0) {
      return res.status(400).json({ error: 'bankCode, accountNumber, accountName and amount are required' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.walletBalance < numericAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' })
    }

    const reference = `BANKTRF-${Date.now()}`
    const provider = getProvider()
    const transferResult = await provider.initiateTransfer({
      reference,
      bankCode,
      accountNumber,
      accountName,
      amount: numericAmount,
      narration
    })

    if (!transferResult.success) {
      return res.status(400).json({ error: transferResult.error || 'Transfer initialization failed' })
    }

    const balanceBefore = user.walletBalance
    user.walletBalance -= numericAmount
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'debit',
      amount: numericAmount,
      category: 'TRANSFER',
      description: narration || `Bank transfer to ${accountName}`,
      merchant: bankName || undefined,
      reference,
      status: 'pending',
      channel: 'bank_transfer',
      direction: 'outbound',
      provider: provider.key,
      providerReference: transferResult.providerReference,
      bankCode,
      bankName: bankName || undefined,
      accountNumber,
      accountName,
      balanceBefore,
      balanceAfter: user.walletBalance
    })

    // Mock rail auto-settlement for near-real-time demo behavior
    setTimeout(async () => {
      try {
        const tx = await Transaction.findOne({ reference, direction: 'outbound' })
        if (!tx || tx.status !== 'pending') return

        const statusResult = await provider.checkTransferStatus({ reference, providerReference: tx.providerReference })
        if (!statusResult.success) return

        if (statusResult.status === 'success') {
          tx.status = 'success'
          await tx.save()
          return
        }

        tx.status = 'failed'
        await tx.save()

        const transferUser = await User.findById(tx.userId)
        if (!transferUser) return

        const refundBefore = transferUser.walletBalance
        transferUser.walletBalance += toNumber(tx.amount)
        await transferUser.save()

        await Transaction.create({
          userId: transferUser._id,
          type: 'credit',
          amount: toNumber(tx.amount),
          category: 'TRANSFER',
          description: `Transfer reversal for ${tx.accountName || 'bank transfer'}`,
          reference: `${tx.reference}-REV`,
          status: 'success',
          channel: 'bank_transfer',
          direction: 'inbound',
          provider: provider.key,
          balanceBefore: refundBefore,
          balanceAfter: transferUser.walletBalance
        })
      } catch (error) {
        // no-op for async demo flow
      }
    }, 1500)

    res.status(202).json({
      message: 'Transfer initiated',
      reference,
      status: 'pending',
      providerReference: transferResult.providerReference,
      newBalance: user.walletBalance
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/transfers/:reference', auth, async (req, res) => {
  try {
    const tx = await Transaction.findOne({
      userId: req.userId,
      reference: req.params.reference,
      channel: 'bank_transfer'
    })
    if (!tx) return res.status(404).json({ error: 'Transfer not found' })

    res.json({
      reference: tx.reference,
      status: tx.status,
      amount: tx.amount,
      bankName: tx.bankName,
      accountName: tx.accountName,
      createdAt: tx.createdAt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Inbound webhook simulation (bank -> Owomi virtual account)
router.post('/webhooks/inbound', async (req, res) => {
  try {
    const { accountNumber, amount, payerName, reference } = req.body
    const numericAmount = toNumber(amount)
    if (!accountNumber || !numericAmount || !reference) {
      return res.status(400).json({ error: 'accountNumber, amount and reference are required' })
    }

    const existing = await Transaction.findOne({ reference })
    if (existing) {
      return res.json({ message: 'Webhook already processed', reference })
    }

    const user = await User.findOne({ virtualAccountNumber: String(accountNumber) })
    if (!user) return res.status(404).json({ error: 'Virtual account not found' })

    const balanceBefore = user.walletBalance
    user.walletBalance += numericAmount
    await user.save()

    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: numericAmount,
      category: 'TRANSFER',
      description: `Bank transfer from ${payerName || 'external bank account'}`,
      merchant: payerName || undefined,
      reference,
      status: 'success',
      channel: 'bank_transfer',
      direction: 'inbound',
      provider: getProvider().key,
      bankName: user.virtualAccountBank,
      accountNumber: String(accountNumber),
      accountName: `${user.firstName} ${user.lastName}`,
      balanceBefore,
      balanceAfter: user.walletBalance
    })

    res.json({ message: 'Wallet credited', reference, newBalance: user.walletBalance })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
