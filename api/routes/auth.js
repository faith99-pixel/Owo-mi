const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate virtual account number
    const virtualAccountNumber = '80' + Math.random().toString().slice(2, 10);
    
    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (email, phone, password, firstName, lastName, virtualAccountNumber) VALUES (?, ?, ?, ?, ?, ?)',
      [email, phone, hashedPassword, firstName, lastName, virtualAccountNumber]
    );
    
    const userId = result.insertId;
    
    // Generate token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'owomi-secret', { expiresIn: '30d' });
    
    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        walletBalance: 0,
        virtualAccountNumber,
        virtualAccountBank: 'Wema Bank'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'owomi-secret', { expiresIn: '30d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        walletBalance: user.walletBalance,
        savingsBalance: user.savingsBalance,
        virtualAccountNumber: user.virtualAccountNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // In production, send email with reset link
    // For now, just return success
    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
