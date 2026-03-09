const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const api = {
  // Auth
  register: async (data) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // Wallet
  getBalance: async () => {
    const res = await fetch(`${API_URL}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  fundWallet: async (amount, source = null) => {
    const res = await fetch(`${API_URL}/wallet/fund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ amount, source })
    });
    return res.json();
  },

  importSMS: async (transactions) => {
    const res = await fetch(`${API_URL}/wallet/import-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ transactions })
    });
    return res.json();
  },

  transfer: async (recipientEmail, amount, description) => {
    const res = await fetch(`${API_URL}/wallet/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ recipientEmail, amount, description })
    });
    return res.json();
  },

  listBanks: async () => {
    const res = await fetch(`${API_URL}/payments/banks`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  resolveBankAccount: async (bankCode, accountNumber) => {
    const res = await fetch(`${API_URL}/payments/resolve-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ bankCode, accountNumber })
    });
    return res.json();
  },

  transferToBank: async (payload) => {
    const res = await fetch(`${API_URL}/payments/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  getBankTransferStatus: async (reference) => {
    const res = await fetch(`${API_URL}/payments/transfers/${reference}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  simulateInboundTransfer: async ({ accountNumber, amount, payerName, reference }) => {
    const params = new URLSearchParams({
      accountNumber: String(accountNumber || ''),
      amount: String(amount || ''),
      payerName: String(payerName || 'Owomi Test Sender'),
      reference: String(reference || `INB-${Date.now()}`)
    });
    const res = await fetch(`${API_URL}/payments/webhooks/inbound?${params.toString()}`, {
      method: 'POST'
    });
    return res.json();
  },

  // Savings
  createGoal: async (data) => {
    const res = await fetch(`${API_URL}/savings/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getGoals: async () => {
    const res = await fetch(`${API_URL}/savings/goals`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  addToGoal: async (goalId, amount) => {
    const res = await fetch(`${API_URL}/savings/goals/${goalId}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  withdrawFromGoal: async (goalId, amount) => {
    const res = await fetch(`${API_URL}/savings/goals/${goalId}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  deleteGoal: async (goalId) => {
    const res = await fetch(`${API_URL}/savings/goals/${goalId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Transactions
  getTransactions: async () => {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getInsights: async () => {
    const res = await fetch(`${API_URL}/transactions/insights`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Expense Split / Group Bills
  getExpenseSplits: async () => {
    const res = await fetch(`${API_URL}/expense-split`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createExpenseSplit: async (data) => {
    const res = await fetch(`${API_URL}/expense-split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  settleExpenseSplit: async (id, participantIndex, participantName) => {
    const res = await fetch(`${API_URL}/expense-split/${id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ participantIndex, participantName })
    });
    return res.json();
  },

  getExpenseSplitStats: async () => {
    const res = await fetch(`${API_URL}/expense-split/stats/summary`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Debt Tracker
  getDebts: async () => {
    const res = await fetch(`${API_URL}/debts`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createDebt: async (data) => {
    const res = await fetch(`${API_URL}/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  payDebt: async (id, amount, note) => {
    const res = await fetch(`${API_URL}/debts/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ amount, note })
    });
    return res.json();
  },

  getDebtStats: async () => {
    const res = await fetch(`${API_URL}/debts/stats/summary`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Financial Goals
  getFinancialGoals: async () => {
    const res = await fetch(`${API_URL}/financial-goals`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createFinancialGoal: async (data) => {
    const res = await fetch(`${API_URL}/financial-goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  contributeToGoal: async (id, amount, note) => {
    const res = await fetch(`${API_URL}/financial-goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ amount, note })
    });
    return res.json();
  },

  // Sinking Funds
  getSinkingFunds: async () => {
    const res = await fetch(`${API_URL}/sinking-funds`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createSinkingFund: async (data) => {
    const res = await fetch(`${API_URL}/sinking-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  contributeToSinkingFund: async (id, amount, note) => {
    const res = await fetch(`${API_URL}/sinking-funds/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ amount, note })
    });
    return res.json();
  },

  // Subscriptions
  getSubscriptions: async () => {
    const res = await fetch(`${API_URL}/subscriptions`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createSubscription: async (data) => {
    const res = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getSubscriptionStats: async () => {
    const res = await fetch(`${API_URL}/subscriptions/stats/summary`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Budget Caps
  getBudgetCaps: async () => {
    const res = await fetch(`${API_URL}/budget-caps`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createBudgetCap: async (data) => {
    const res = await fetch(`${API_URL}/budget-caps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Investments
  getInvestments: async () => {
    const res = await fetch(`${API_URL}/investments`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createInvestment: async (data) => {
    const res = await fetch(`${API_URL}/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateInvestment: async (id, data) => {
    const res = await fetch(`${API_URL}/investments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getInvestmentPortfolio: async () => {
    const res = await fetch(`${API_URL}/investments/stats/portfolio`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Invoices
  getInvoices: async () => {
    const res = await fetch(`${API_URL}/invoices`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  createInvoice: async (data) => {
    const res = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  markInvoicePaid: async (id) => {
    const res = await fetch(`${API_URL}/invoices/${id}/paid`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Utility endpoints
  convertCurrency: async (amount, fromCurrency, toCurrency) => {
    const res = await fetch(`${API_URL}/utility/currency/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({ amount, fromCurrency, toCurrency })
    });
    return res.json();
  },

  calculateEmergencyFund: async (monthlyExpenses, targetMonths) => {
    const res = await fetch(`${API_URL}/utility/emergency-fund/calculate?monthlyExpenses=${monthlyExpenses}&targetMonths=${targetMonths}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  calculateEventFund: async (data) => {
    const res = await fetch(`${API_URL}/utility/event-fund/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getSalaryProjection: async () => {
    const res = await fetch(`${API_URL}/utility/salary/projection`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getMonthlyReport: async (month, year) => {
    const res = await fetch(`${API_URL}/utility/monthly-report?month=${month}&year=${year}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getHealthScore: async () => {
    const res = await fetch(`${API_URL}/utility/health-score`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  getAutoSavingsRules: async () => {
    const res = await fetch(`${API_URL}/utility/auto-savings/rules`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  }
};
