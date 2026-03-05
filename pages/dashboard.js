import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { parseTransaction, detectLeaks } from '../lib/parser'
import { api } from '../lib/api'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'savings', label: 'Savings', icon: '💰' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'history', label: 'History', icon: '📜' }
]

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [userInitial, setUserInitial] = useState('O')
  const [balance, setBalance] = useState({ walletBalance: 0, savingsBalance: 0, totalBalance: 0 })
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [insights, setInsights] = useState({ categorySpending: [], totalSpent: 0 })
  const [showFundModal, setShowFundModal] = useState(false)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [smsText, setSmsText] = useState('')
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '' })
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [savingsAmount, setSavingsAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('user')) {
      router.push('/login')
      return
    }
    const user = JSON.parse(localStorage.getItem('user'))
    setUserInitial(user.firstName?.charAt(0) || 'O')
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [balanceData, transactionsData, goalsData, insightsData] = await Promise.all([
        api.getBalance(),
        api.getTransactions(),
        api.getGoals(),
        api.getInsights()
      ])
      setBalance(balanceData)
      setTransactions(transactionsData)
      setGoals(goalsData)
      setInsights(insightsData)
    } catch (error) {
      console.error('Load error:', error)
    }
  }

  const handleFundWallet = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.fundWallet(parseFloat(fundAmount))
      toast.success('Wallet funded!')
      setBalance({ ...balance, walletBalance: result.newBalance })
      setShowFundModal(false)
      setFundAmount('')
      loadData()
    } catch (error) {
      toast.error('Funding failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImportSMS = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const lines = smsText.split('\n').filter(line => line.trim())
      const parsed = lines.map(line => parseTransaction(line)).filter(Boolean)
      const result = await api.importSMS(parsed)
      toast.success(`${result.count} transactions imported!`)
      setShowSMSModal(false)
      setSmsText('')
      loadData()
    } catch (error) {
      toast.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createGoal({ title: goalForm.title, targetAmount: parseFloat(goalForm.targetAmount) })
      toast.success('Goal created!')
      setShowGoalModal(false)
      setGoalForm({ title: '', targetAmount: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToGoal = async (goalId) => {
    if (!savingsAmount) return
    setLoading(true)
    try {
      await api.addToGoal(goalId, parseFloat(savingsAmount))
      toast.success('Money added to savings!')
      setSavingsAmount('')
      setSelectedGoal(null)
      loadData()
    } catch (error) {
      toast.error(error.error || 'Failed to add money')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawFromGoal = async (goalId) => {
    if (!savingsAmount) return
    setLoading(true)
    try {
      await api.withdrawFromGoal(goalId, parseFloat(savingsAmount))
      toast.success('Money withdrawn!')
      setSavingsAmount('')
      setSelectedGoal(null)
      loadData()
    } catch (error) {
      toast.error(error.error || 'Failed to withdraw')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="mobile-view">
          <header className="app-header">
            <div>
              <h1>Owó Mi</h1>
              <p>Your money tracker</p>
            </div>
            <button className="avatar-btn" onClick={() => router.push('/login')}>
              {userInitial}
            </button>
          </header>

          <div className="tab-content">
            {activeTab === 'home' && (
              <>
                <div className="balance-card">
                  <p className="balance-label">Wallet Balance</p>
                  <h2 className="balance-amount">₦{balance.walletBalance.toLocaleString()}</h2>
                  <div className="balance-row">
                    <div className="balance-badge">Savings: ₦{balance.savingsBalance.toLocaleString()}</div>
                    <div className="balance-badge">Total: ₦{balance.totalBalance.toLocaleString()}</div>
                  </div>
                </div>

                <div className="action-grid">
                  <button className="action-btn" onClick={() => setShowFundModal(true)}>
                    <span>💳</span>
                    <small>Fund Wallet</small>
                  </button>
                  <button className="action-btn" onClick={() => setShowSMSModal(true)}>
                    <span>📱</span>
                    <small>Import SMS</small>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('savings')}>
                    <span>💰</span>
                    <small>Save Money</small>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('insights')}>
                    <span>📊</span>
                    <small>Insights</small>
                  </button>
                </div>

                <div className="section-header">
                  <h3>Recent Transactions</h3>
                  <button onClick={() => setActiveTab('history')} className="link-btn">View all</button>
                </div>

                <div className="transaction-list">
                  {transactions.slice(0, 5).map((tx) => (
                    <div className="transaction-item" key={tx.id}>
                      <div className={`tx-icon ${tx.type}`}>{tx.type === 'credit' ? '↓' : '↑'}</div>
                      <div className="tx-details">
                        <strong>{tx.description || tx.category}</strong>
                        <p>{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="tx-amount">
                        <strong className={tx.type}>{tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                  {!transactions.length && <p className="empty-state">No transactions yet</p>}
                </div>
              </>
            )}

            {activeTab === 'savings' && (
              <>
                <div className="section-header">
                  <h3>Savings Goals</h3>
                  <button onClick={() => setShowGoalModal(true)} className="link-btn">+ New Goal</button>
                </div>

                <div className="goals-list">
                  {goals.map((goal) => (
                    <div className="goal-card" key={goal.id}>
                      <div className="goal-header">
                        <h4>{goal.title}</h4>
                        <span className="goal-emoji">{goal.emoji}</span>
                      </div>
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100, 100)}%` }}></div>
                        </div>
                        <p>₦{parseFloat(goal.currentAmount).toLocaleString()} / ₦{parseFloat(goal.targetAmount).toLocaleString()}</p>
                      </div>
                      <div className="goal-actions">
                        <button onClick={() => setSelectedGoal({ ...goal, action: 'add' })} className="btn-small">Add Money</button>
                        <button onClick={() => setSelectedGoal({ ...goal, action: 'withdraw' })} className="btn-small-outline">Withdraw</button>
                      </div>
                    </div>
                  ))}
                  {!goals.length && <p className="empty-state">No savings goals yet. Create one!</p>}
                </div>
              </>
            )}

            {activeTab === 'insights' && (
              <>
                <div className="insights-hero">
                  <h2>Spending Insights</h2>
                  <p className="total-spent">Total Spent: ₦{insights.totalSpent.toLocaleString()}</p>
                </div>

                <div className="category-list">
                  {insights.categorySpending.map((cat) => (
                    <div className="category-card" key={cat.category}>
                      <div className="category-icon">{getCategoryIcon(cat.category)}</div>
                      <div className="category-details">
                        <strong>{cat.category}</strong>
                        <p>{cat.count} transactions</p>
                      </div>
                      <div className="category-amount">
                        <strong>₦{cat.total.toLocaleString()}</strong>
                        <span>{((cat.total / insights.totalSpent) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                  {!insights.categorySpending.length && <p className="empty-state">No spending data yet</p>}
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className="section-header">
                  <h3>All Transactions</h3>
                </div>

                <div className="transaction-list">
                  {transactions.map((tx) => (
                    <div className="transaction-item" key={tx.id}>
                      <div className={`tx-icon ${tx.type}`}>{tx.type === 'credit' ? '↓' : '↑'}</div>
                      <div className="tx-details">
                        <strong>{tx.description || tx.category}</strong>
                        <p>{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="tx-amount">
                        <strong className={tx.type}>{tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}</strong>
                        <span>{tx.source}</span>
                      </div>
                    </div>
                  ))}
                  {!transactions.length && <p className="empty-state">No transactions yet</p>}
                </div>
              </>
            )}
          </div>

          <nav className="bottom-nav">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? 'active' : ''}>
                <span>{tab.icon}</span>
                <small>{tab.label}</small>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {showFundModal && (
        <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Fund Wallet</h3>
            <form onSubmit={handleFundWallet}>
              <input type="number" placeholder="Amount" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} required />
              <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Fund Wallet'}</button>
            </form>
          </div>
        </div>
      )}

      {showSMSModal && (
        <div className="modal-overlay" onClick={() => setShowSMSModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Import SMS Alerts</h3>
            <form onSubmit={handleImportSMS}>
              <textarea placeholder="Paste bank SMS alerts..." value={smsText} onChange={(e) => setSmsText(e.target.value)} required />
              <button type="submit" disabled={loading}>{loading ? 'Importing...' : 'Import'}</button>
            </form>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Savings Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <input placeholder="Goal name" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
              <input type="number" placeholder="Target amount" value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })} required />
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</button>
            </form>
          </div>
        </div>
      )}

      {selectedGoal && (
        <div className="modal-overlay" onClick={() => setSelectedGoal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedGoal.action === 'add' ? 'Add Money' : 'Withdraw'} - {selectedGoal.title}</h3>
            <input type="number" placeholder="Amount" value={savingsAmount} onChange={(e) => setSavingsAmount(e.target.value)} />
            <button onClick={() => selectedGoal.action === 'add' ? handleAddToGoal(selectedGoal.id) : handleWithdrawFromGoal(selectedGoal.id)} disabled={loading}>
              {loading ? 'Processing...' : selectedGoal.action === 'add' ? 'Add Money' : 'Withdraw'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .app-container { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); }
        .app-wrapper { max-width: 600px; margin: 0 auto; }
        .mobile-view { background: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        .app-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: linear-gradient(135deg, #00A86B 0%, #008751 100%); color: #fff; }
        .app-header h1 { font-size: 28px; font-weight: 800; margin: 0; }
        .app-header p { font-size: 14px; opacity: 0.9; margin: 4px 0 0; }
        .avatar-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: #fff; font-weight: 700; font-size: 18px; cursor: pointer; }
        .tab-content { flex: 1; padding: 20px; overflow-y: auto; padding-bottom: 100px; }
        .balance-card { background: linear-gradient(135deg, #00A86B 0%, #008751 100%); border-radius: 20px; padding: 24px; color: #fff; box-shadow: 0 8px 24px rgba(0,168,107,0.3); margin-bottom: 20px; }
        .balance-label { font-size: 14px; opacity: 0.9; margin: 0 0 8px; }
        .balance-amount { font-size: 42px; font-weight: 800; margin: 0 0 12px; }
        .balance-row { display: flex; gap: 10px; }
        .balance-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .action-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .action-btn { background: #f9f9f9; border: 2px solid #e5e5e5; border-radius: 16px; padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
        .action-btn span { font-size: 28px; }
        .action-btn small { font-size: 11px; font-weight: 600; color: #333; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 16px; }
        .section-header h3 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0; }
        .link-btn { background: none; border: none; color: #00A86B; font-weight: 600; font-size: 14px; cursor: pointer; }
        .transaction-list { display: grid; gap: 1px; background: #e5e5e5; border-radius: 16px; overflow: hidden; }
        .transaction-item { background: #fff; padding: 16px; display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; }
        .tx-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
        .tx-icon.credit { background: #e8f5e9; color: #2e7d32; }
        .tx-icon.debit { background: #ffebee; color: #c62828; }
        .tx-details strong { font-size: 15px; color: #1a1a1a; display: block; }
        .tx-details p { font-size: 12px; color: #999; margin: 4px 0 0; }
        .tx-amount { text-align: right; }
        .tx-amount strong { font-size: 16px; display: block; }
        .tx-amount strong.credit { color: #2e7d32; }
        .tx-amount strong.debit { color: #c62828; }
        .tx-amount span { font-size: 10px; color: #999; }
        .goals-list { display: grid; gap: 16px; }
        .goal-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 16px; padding: 20px; }
        .goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .goal-header h4 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0; }
        .goal-emoji { font-size: 32px; }
        .goal-progress { margin-bottom: 16px; }
        .progress-bar { height: 8px; background: #e5e5e5; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #00A86B 0%, #008751 100%); }
        .goal-progress p { font-size: 14px; color: #666; margin: 0; }
        .goal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-small { padding: 10px; background: #00A86B; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-small-outline { padding: 10px; background: transparent; color: #00A86B; border: 2px solid #00A86B; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .insights-hero { text-align: center; margin-bottom: 24px; }
        .insights-hero h2 { font-size: 28px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
        .total-spent { font-size: 20px; color: #00A86B; font-weight: 700; }
        .category-list { display: grid; gap: 12px; }
        .category-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 16px; padding: 16px; display: grid; grid-template-columns: 50px 1fr auto; gap: 12px; align-items: center; }
        .category-icon { width: 50px; height: 50px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .category-details strong { font-size: 16px; color: #1a1a1a; display: block; }
        .category-details p { font-size: 12px; color: #999; margin: 4px 0 0; }
        .category-amount { text-align: right; }
        .category-amount strong { font-size: 18px; color: #1a1a1a; display: block; }
        .category-amount span { font-size: 12px; color: #666; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e5e5; display: grid; grid-template-columns: repeat(4, 1fr); padding: 8px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
        .bottom-nav button { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #999; cursor: pointer; padding: 8px; }
        .bottom-nav button span { font-size: 24px; }
        .bottom-nav button small { font-size: 11px; font-weight: 600; }
        .bottom-nav button.active { color: #00A86B; }
        .empty-state { text-align: center; color: #999; padding: 32px 16px; font-size: 14px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #fff; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; }
        .modal-content h3 { font-size: 20px; font-weight: 700; margin: 0 0 16px; }
        .modal-content input, .modal-content textarea { width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 10px; font-size: 14px; margin-bottom: 12px; }
        .modal-content textarea { min-height: 120px; resize: vertical; }
        .modal-content button { width: 100%; padding: 14px; background: #00A86B; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .modal-content button:disabled { opacity: 0.6; }
        @media (min-width: 768px) {
          .app-wrapper { padding: 24px; }
          .mobile-view { border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
          .bottom-nav { position: sticky; }
        }
      `}</style>
    </div>
  )
}

function getCategoryIcon(category) {
  const icons = {
    TRANSPORT: '🚗', BETTING: '🎰', FOOD: '🍔', AIRTIME: '📱', DATA: '📶',
    TRANSFER: '💸', SHOPPING: '🛍️', ENTERTAINMENT: '🎬', BILLS: '💡',
    SAVINGS: '💰', FUNDING: '💳', WITHDRAWAL: '🏧'
  }
  return icons[category] || '💳'
}
