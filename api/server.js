const express = require('express');
const cors = require('cors');
const db = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const savingsRoutes = require('./routes/savings');
const transactionRoutes = require('./routes/transactions');
const virtualAccountRoutes = require('./routes/virtualAccount');

const app = express();

app.use(cors());
app.use(express.json());

// Test MySQL connection
db.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected to owomi database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/virtual-account', virtualAccountRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Owó Mi API is running', database: 'MySQL' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Owó Mi API running on port ${PORT}`);
});

module.exports = app;
