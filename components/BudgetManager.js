import { useState, useEffect } from 'react'

export default function BudgetManager({ transactions, categorySpending }) {
  const [budgets, setBudgets] = useState({})
  const [showSetBudget, setShowSetBudget] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('budgets')
    if (saved) setBudgets(JSON.parse(saved))
  }, [])

  const saveBudget = () => {
    const newBudgets = { ...budgets, [selectedCategory]: parseFloat(budgetAmount) }
    setBudgets(newBudgets)
    localStorage.setItem('budgets', JSON.stringify(newBudgets))
    setShowSetBudget(false)
    setBudgetAmount('')
  }

  const categories = ['TRANSPORT', 'FOOD', 'AIRTIME', 'DATA', 'BETTING', 'SHOPPING', 'ENTERTAINMENT']

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 30, marginBottom: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, color: '#1A1A2E' }}>🎯 Budget Tracker</h2>
        <button onClick={() => setShowSetBudget(!showSetBudget)} style={{ padding: '10px 20px', background: '#00A86B', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
          {showSetBudget ? 'Cancel' : 'Set Budget'}
        </button>
      </div>

      {showSetBudget && (
        <div style={{ background: '#F8F9FA', padding: 20, borderRadius: 10, marginBottom: 20 }}>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16, borderRadius: 5, border: '2px solid #E0E0E0' }}>
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="number" placeholder="Budget Amount (₦)" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16, borderRadius: 5, border: '2px solid #E0E0E0' }} />
          <button onClick={saveBudget} disabled={!selectedCategory || !budgetAmount} style={{ width: '100%', padding: 12, background: '#00A86B', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
            Save Budget
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 15 }}>
        {Object.entries(budgets).map(([cat, budget]) => {
          const spent = categorySpending[cat] || 0
          const percentage = (spent / budget) * 100
          const isOverBudget = percentage > 100
          const isWarning = percentage > 80

          return (
            <div key={cat} style={{ padding: 15, background: isOverBudget ? '#FFE5E5' : isWarning ? '#FFF3E0' : '#F8F9FA', borderRadius: 10, border: `2px solid ${isOverBudget ? '#E63946' : isWarning ? '#FDB913' : '#E0E0E0'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{cat}</strong>
                <span style={{ color: isOverBudget ? '#E63946' : '#1A1A2E' }}>₦{spent.toLocaleString()} / ₦{budget.toLocaleString()}</span>
              </div>
              <div style={{ background: '#E0E0E0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', background: isOverBudget ? '#E63946' : isWarning ? '#FDB913' : '#00A86B', transition: 'width 0.3s' }} />
              </div>
              {isOverBudget && <p style={{ margin: '8px 0 0', color: '#E63946', fontSize: 14 }}>⚠️ Over budget by ₦{(spent - budget).toLocaleString()}!</p>}
              {isWarning && !isOverBudget && <p style={{ margin: '8px 0 0', color: '#F59E0B', fontSize: 14 }}>⚠️ {percentage.toFixed(0)}% of budget used</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
