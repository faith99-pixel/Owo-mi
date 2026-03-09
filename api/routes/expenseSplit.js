const express = require('express');
const router = express.Router();
const ExpenseSplit = require('../models/ExpenseSplit');
const auth = require('../middleware/auth');

// Get all expense splits for user
router.get('/', auth, async (req, res) => {
  try {
    const splits = await ExpenseSplit.find({ 
      userId: req.userId,
      status: { $ne: 'deleted' }
    }).sort({ createdAt: -1 });
    res.json(splits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense split
router.get('/:id', auth, async (req, res) => {
  try {
    const split = await ExpenseSplit.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });
    if (!split) {
      return res.status(404).json({ error: 'Expense split not found' });
    }
    res.json(split);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new expense split
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, totalAmount, splitType, participants, ownerName, category, dueDate } = req.body;
    
    // Calculate equal split if needed
    let processedParticipants = participants;
    if (splitType === 'equal' && participants && participants.length > 0) {
      const shareAmount = totalAmount / participants.length;
      processedParticipants = participants.map(p => ({
        ...p,
        shareAmount,
        sharePercentage: 100 / participants.length
      }));
    }
    
    const split = new ExpenseSplit({
      userId: req.userId,
      title,
      description,
      totalAmount,
      splitType: splitType || 'equal',
      participants: processedParticipants,
      ownerName: ownerName || 'Me',
      category: category || 'other',
      dueDate
    });
    
    await split.save();
    res.status(201).json(split);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense split
router.put('/:id', auth, async (req, res) => {
  try {
    const split = await ExpenseSplit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!split) {
      return res.status(404).json({ error: 'Expense split not found' });
    }
    res.json(split);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark participant as paid
router.post('/:id/settle', auth, async (req, res) => {
  try {
    const { participantIndex, participantName } = req.body;
    const split = await ExpenseSplit.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!split) {
      return res.status(404).json({ error: 'Expense split not found' });
    }
    
    if (participantIndex !== undefined && split.participants[participantIndex]) {
      split.participants[participantIndex].isPaid = true;
      split.participants[participantIndex].paidAt = new Date();
    } else if (participantName) {
      const participant = split.participants.find(p => p.name === participantName);
      if (participant) {
        participant.isPaid = true;
        participant.paidAt = new Date();
      }
    }
    
    // Check if all settled
    const allPaid = split.participants.every(p => p.isPaid);
    if (allPaid) {
      split.status = 'settled';
      split.settledAt = new Date();
    }
    
    await split.save();
    res.json(split);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense split (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const split = await ExpenseSplit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );
    if (!split) {
      return res.status(404).json({ error: 'Expense split not found' });
    }
    res.json({ message: 'Expense split deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get summary stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const splits = await ExpenseSplit.find({ 
      userId: req.userId,
      status: { $ne: 'deleted' }
    });
    
    const totalOwed = splits.reduce((sum, s) => {
      const unpaid = s.participants.filter(p => !p.isPaid);
      return sum + unpaid.reduce((pSum, p) => pSum + p.shareAmount, 0);
    }, 0);
    
    const totalPaid = splits.reduce((sum, s) => {
      const paid = s.participants.filter(p => p.isPaid);
      return sum + paid.reduce((pSum, p) => pSum + p.shareAmount, 0);
    }, 0);
    
    const activeSplits = splits.filter(s => s.status === 'active').length;
    const settledSplits = splits.filter(s => s.status === 'settled').length;
    
    res.json({
      totalSplits: splits.length,
      activeSplits,
      settledSplits,
      totalOwed,
      totalPaid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

