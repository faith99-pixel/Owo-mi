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
  }
};
