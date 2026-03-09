const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Currency conversion rates (would be fetched from an API in production)
const EXCHANGE_RATES = {
  NGN: 1,
  USD: 0.00065,      // 1 NGN = 0.00065 USD
  GBP: 0.00051,      // 1 NGN = 0.00051 GBP
  EUR: 0.00060,      // 1 NGN = 0.00060 EUR
  KES: 0.095,        // 1 NGN = 0.095 KES
  GHS: 0.0095,       // 1 NGN = 0.0095 GHS
  ZAR: 0.012,        // 1 NGN = 0.012 ZAR
  JPY: 0.097,        // 1 NGN = 0.097 JPY
  CNY: 0.0047,       // 1 NGN = 0.0047 CNY
  AED: 0.0024        // 1 NGN = 0.0024 AED
};

// Currency converter
router.post('/currency/convert', auth, (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1;
    const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1;
    
    // Convert to NGN first, then to target currency
    const amountInNGN = amount / fromRate;
    const convertedAmount = amountInNGN * toRate;
    
    res.json({
      originalAmount: amount,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rate: toRate / fromRate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get supported currencies
router.get('/currency/rates', auth, (req, res) => {
  res.json({
    base: 'NGN',
    rates: EXCHANGE_RATES,
    lastUpdated: new Date().toISOString()
  });
});

// Emergency fund calculator
router.get('/emergency-fund/calculate', auth, async (req, res) => {
  try {
    const { monthlyExpenses, targetMonths } = req.query;
    
    const expenses = parseFloat(monthlyExpenses) || 0;
    const months = parseInt(targetMonths) || 3;
    
    // Standard recommendation: 3-6 months of expenses
    const minimum = expenses * 3;
    const recommended = expenses * 6;
    const target = expenses * months;
    
    // Get user's current savings
    const userId = req.userId;
    // This would need to come from wallet/savings - placeholder
    const currentSavings = 0;
    
    res.json({
      monthlyExpenses: expenses,
      targetMonths: months,
      minimumFund: minimum,
      recommendedFund: recommended,
      targetFund: target,
      currentSavings,
      gap: Math.max(0, minimum - currentSavings),
      monthsCovered: currentSavings > 0 ? Math.floor(currentSavings / expenses) : 0,
      recommendation: currentSavings >= recommended 
        ? '🎉 You have a healthy emergency fund!'
        : currentSavings >= minimum
          ? '✅ You meet the minimum. Keep building to reach 6 months!'
          : '⚠️ Build your emergency fund to cover at least 3 months of expenses.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wedding/Event fund calculator
router.post('/event-fund/calculate', auth, (req, res) => {
  try {
    const { targetAmount, eventDate, currentSavings } = req.body;
    
    const target = parseFloat(targetAmount) || 0;
    const saved = parseFloat(currentSavings) || 0;
    
    let monthsUntilEvent = 12;
    if (eventDate) {
      const event = new Date(eventDate);
      const now = new Date();
      monthsUntilEvent = Math.max(1, Math.ceil((event - now) / (1000 * 60 * 60 * 24 * 30)));
    }
    
    const remaining = Math.max(0, target - saved);
    const monthlySavingsNeeded = Math.ceil(remaining / monthsUntilEvent);
    
    res.json({
      targetAmount: target,
      currentSavings: saved,
      remaining,
      monthsUntilEvent,
      monthlySavingsNeeded,
      weeklySavingsNeeded: Math.ceil(monthlySavingsNeeded / 4),
      dailySavingsNeeded: Math.ceil(monthlySavingsNeeded / 30),
      eventDate,
      recommendation: monthlySavingsNeeded > 50000
        ? '💪 Aggressive goal! Consider extending your timeline or reducing scope.'
        : '✅ Achievable! Set up automatic transfers to reach your goal.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salary projection based on transaction patterns
router.get('/salary/projection', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.userId,
      type: 'credit',
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).sort({ createdAt: 1 });
    
    // Look for recurring credit patterns (likely salary)
    const creditDates = transactions.map(t => new Date(t.createdAt));
    
    // Simple pattern detection
    const avgDaysBetween = creditDates.length > 1 
      ? (creditDates[creditDates.length - 1] - creditDates[0]) / (creditDates.length - 1) / (1000 * 60 * 60 * 24)
      : 0;
    
    // Detect likely salary dates
    const dayOfMonths = creditDates.map(d => d.getDate()).sort((a, b) => a - b);
    const commonPayDays = dayOfMonths.filter(d => d >= 1 && d <= 31);
    
    // Calculate average credit
    const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgCredit = transactions.length > 0 ? totalCredits / transactions.length : 0;
    
    // Next expected salary
    let nextExpectedDate = null;
    if (avgDaysBetween > 0 && avgDaysBetween < 35) {
      nextExpectedDate = new Date(creditDates[creditDates.length - 1]);
      nextExpectedDate.setDate(nextExpectedDate.getDate() + Math.round(avgDaysBetween));
    }
    
    res.json({
      detectedFrequency: avgDaysBetween > 0 ? `${Math.round(avgDaysBetween)} days` : 'Unknown',
      averageCredit: avgCredit,
      creditCount: transactions.length,
      totalCredits,
      nextExpectedSalaryDate: nextExpectedDate,
      confidence: transactions.length >= 3 ? 'high' : transactions.length >= 2 ? 'medium' : 'low',
      message: transactions.length < 2
        ? 'Need more credit transactions to detect salary pattern'
        : `Your salary appears to come every ~${Math.round(avgDaysBetween)} days.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly report card
router.get('/monthly-report', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    
    const transactions = await Transaction.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');
    
    const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalSpending = debits.reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    
    // Category breakdown
    const categoryBreakdown = {};
    debits.forEach(t => {
      const cat = t.category || 'OTHER';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
    });
    
    const topCategories = Object.entries(categoryBreakdown)
      .map(([cat, amount]) => ({ category: cat, amount, percentage: (amount / totalSpending) * 100 }))
      .sort((a, b) => b.amount - a.amount);
    
    // Compare to previous month
    const prevStartDate = new Date(targetYear, targetMonth - 1, 1);
    const prevEndDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const prevTransactions = await Transaction.find({
      userId: req.userId,
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });
    
    const prevDebits = prevTransactions.filter(t => t.type === 'debit');
    const prevTotalSpending = prevDebits.reduce((sum, t) => sum + t.amount, 0);
    
    const spendingChange = prevTotalSpending > 0 
      ? ((totalSpending - prevTotalSpending) / prevTotalSpending) * 100 
      : 0;
    
    // Day with highest spending
    const dailySpending = {};
    debits.forEach(t => {
      const day = new Date(t.createdAt).toDateString();
      dailySpending[day] = (dailySpending[day] || 0) + t.amount;
    });
    
    const highestSpendDay = Object.entries(dailySpending)
      .sort((a, b) => b[1] - a[1])[0];
    
    res.json({
      period: { month: targetMonth, year: targetYear, label: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }) },
      summary: {
        totalIncome,
        totalSpending,
        savings,
        savingsRate: savingsRate.toFixed(1),
        transactionCount: transactions.length
      },
      topCategories,
      comparison: {
        vsPreviousMonth: spendingChange.toFixed(1),
        trend: spendingChange < 0 ? 'improving' : spendingChange > 0 ? 'increasing' : 'stable'
      },
      highestSpendDay: highestSpendDay ? { date: highestSpendDay[0], amount: highestSpendDay[1] } : null,
      grade: savingsRate >= 20 ? 'A' : savingsRate >= 10 ? 'B' : savingsRate >= 5 ? 'C' : 'D',
      message: savingsRate >= 20 
        ? '🌟 Excellent! You\'re saving well.'
        : savingsRate >= 10 
          ? '👍 Good job! Room to save more.'
          : '💡 Try to save at least 20% of income.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Financial health score
router.get('/health-score', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const debits = transactions.filter(t => t.type === 'debit');
    const credits = transactions.filter(t => t.type === 'credit');
    
    const totalSpending = debits.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;
    
    // Score components (0-100 each)
    let savingsScore = Math.min(100, Math.max(0, savingsRate * 5)); // 20%+ = 100
    let diversityScore = Math.min(100, (Object.keys(new Set(debits.map(t => t.category))).length) * 20); // 5+ categories = 100
    let consistencyScore = 100; // Placeholder
    let leakScore = 100; // From existing leak detection
    
    // Calculate leak score
    const leakCategories = ['BETTING', 'POS', 'AIRTIME', 'DATA'];
    const leakSpending = debits
      .filter(t => leakCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const leakRatio = totalSpending > 0 ? leakSpending / totalSpending : 0;
    leakScore = Math.max(0, 100 - leakRatio * 200);
    
    // Weighted overall score
    const overallScore = Math.round(
      savingsScore * 0.3 + 
      diversityScore * 0.2 + 
      consistencyScore * 0.2 + 
      leakScore * 0.3
    );
    
    // Recommendations
    const recommendations = [];
    if (savingsScore < 50) recommendations.push('Increase your savings rate to at least 20%');
    if (diversityScore < 50) recommendations.push('Track expenses across more categories');
    if (leakScore < 70) recommendations.push('Reduce leak spending (betting, POS fees, data)');
    
    res.json({
      overallScore,
      breakdown: {
        savings: Math.round(savingsScore),
        diversity: Math.round(diversityScore),
        consistency: consistencyScore,
        leakControl: Math.round(leakScore)
      },
      metrics: {
        savingsRate: savingsRate.toFixed(1),
        totalSpending,
        totalIncome,
        categoryCount: new Set(debits.map(t => t.category)).size
      },
      recommendations,
      grade: overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : 'D'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Automated savings rules
router.get('/auto-savings/rules', auth, async (req, res) => {
  try {
    // This would typically be stored in a model
    // Returning some suggested rules based on spending patterns
    const transactions = await Transaction.find({ 
      userId: req.userId,
      type: 'debit',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const bettingTotal = transactions
      .filter(t => t.category === 'BETTING')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const suggestions = [];
    
    if (bettingTotal > 0) {
      suggestions.push({
        id: 'betting_save',
        name: 'Save instead of betting',
        trigger: 'BETTING spend detected',
        action: 'Auto-save 20% of betting amount',
        potentialSavings: Math.round(bettingTotal * 0.2),
        enabled: false
      });
    }
    
    suggestions.push({
      id: 'round_up',
      name: 'Round up purchases',
      trigger: 'Any card purchase',
      action: 'Round up to nearest ₦100 and save difference',
      potentialSavings: 5000,
      enabled: false
    });
    
    suggestions.push({
      id: 'salary_save',
      name: 'Salary advance save',
      trigger: 'Salary credit detected',
      action: 'Transfer 10% to savings immediately',
      potentialSavings: 'variable',
      enabled: false
    });
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

