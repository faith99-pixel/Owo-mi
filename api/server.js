const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const savingsRoutes = require('./routes/savings');
const transactionRoutes = require('./routes/transactions');
const virtualAccountRoutes = require('./routes/virtualAccount');
const paymentRoutes = require('./routes/payments');
const expenseSplitRoutes = require('./routes/expenseSplit');
const debtRoutes = require('./routes/debts');
const financialGoalRoutes = require('./routes/financialGoals');
const sinkingFundRoutes = require('./routes/sinkingFunds');
const subscriptionRoutes = require('./routes/subscriptions');
const budgetCapRoutes = require('./routes/budgetCaps');
const investmentRoutes = require('./routes/investments');
const invoiceRoutes = require('./routes/invoices');
const utilityRoutes = require('./routes/utility');

const app = express();

app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf?.toString('utf8') || '';
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/virtual-account', virtualAccountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expense-split', expenseSplitRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/financial-goals', financialGoalRoutes);
app.use('/api/sinking-funds', sinkingFundRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/budget-caps', budgetCapRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/utility', utilityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Owo Mi API is running', database: 'MongoDB' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/owomi';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Owo Mi API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });

module.exports = app;
