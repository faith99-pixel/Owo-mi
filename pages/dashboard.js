import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { parseTransaction, detectLeaks } from '../lib/parser'
import { api } from '../lib/api'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'cards', label: 'Cards', icon: '💳' },
  { id: 'savings', label: 'Savings', icon: '💰' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'history', label: 'History', icon: '📜' }
]

const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Moniepoint MFB',
  'Opay',
  'Parallex Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Nigeria',
  'Sterling Bank',
  'SunTrust Bank Nigeria',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank'
]

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [userInitial, setUserInitial] = useState('O')
  const [balance, setBalance] = useState({ walletBalance: 0, savingsBalance: 0, totalBalance: 0 })
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [insights, setInsights] = useState({ categorySpending: [], totalSpent: 0 })
  const [cards, setCards] = useState([])
  const [showFundModal, setShowFundModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [selectedFundingCard, setSelectedFundingCard] = useState(null)
  const [smsText, setSmsText] = useState('')
  const [cardForm, setCardForm] = useState({ bankName: '', cardHolder: '', cardNumber: '', expiry: '' })
  const [bankSearchQuery, setBankSearchQuery] = useState('')
  const [showBankDropdown, setShowBankDropdown] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '' })
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [savingsAmount, setSavingsAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAmounts, setShowAmounts] = useState(true)

  const parseStoredUser = (raw) => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      if (typeof raw === 'string') {
        return { email: raw, firstName: raw.split('@')[0] }
      }
      return null
    }
  }

  useEffect(() => {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) {
      router.push('/login')
      return
    }
    const user = parseStoredUser(rawUser)
    if (!user) {
      localStorage.removeItem('user')
      router.push('/login')
      return
    }
    setUserInitial(user.firstName?.charAt(0) || 'O')
    const privacy = localStorage.getItem('owomi_show_amounts')
    if (privacy !== null) {
      setShowAmounts(privacy === 'true')
    }
    const savedCards = localStorage.getItem('owomi_cards')
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards)
        setCards(Array.isArray(parsedCards) ? parsedCards : [])
      } catch {
        setCards([])
      }
    }
    loadData()
  }, [router])

  const persistCards = (nextCards) => {
    setCards(nextCards)
    localStorage.setItem('owomi_cards', JSON.stringify(nextCards))
  }

  const toggleAmountPrivacy = () => {
    setShowAmounts((prev) => {
      const next = !prev
      localStorage.setItem('owomi_show_amounts', String(next))
      return next
    })
  }

  const toNumber = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const formatCurrency = (value) => toNumber(value).toLocaleString()

  const normalizeBalance = (data) => {
    const walletBalance = toNumber(data?.walletBalance)
    const savingsBalance = toNumber(data?.savingsBalance)
    const totalBalance = toNumber(
      data?.totalBalance !== undefined ? data.totalBalance : walletBalance + savingsBalance
    )
    return { walletBalance, savingsBalance, totalBalance }
  }

  const loadData = async () => {
    try {
      const [balanceData, transactionsData, goalsData, insightsData] = await Promise.all([
        api.getBalance(),
        api.getTransactions(),
        api.getGoals(),
        api.getInsights()
      ])
      setBalance(normalizeBalance(balanceData))
      setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
      setGoals(Array.isArray(goalsData) ? goalsData : [])
      setInsights({
        categorySpending: Array.isArray(insightsData?.categorySpending) ? insightsData.categorySpending : [],
        totalSpent: toNumber(insightsData?.totalSpent)
      })
    } catch (error) {
      console.error('Load error:', error)
    }
  }

  const handleFundWallet = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.fundWallet(parseFloat(fundAmount), selectedFundingCard ? {
        bankName: selectedFundingCard.bankName,
        last4: selectedFundingCard.last4
      } : null)
      if (result?.error) {
        throw new Error(result.error)
      }
      toast.success('Wallet funded!')
      setBalance((prev) => {
        const nextWallet = toNumber(result.newBalance)
        const nextSavings = toNumber(prev?.savingsBalance)
        return {
          walletBalance: nextWallet,
          savingsBalance: nextSavings,
          totalBalance: nextWallet + nextSavings
        }
      })
      setShowFundModal(false)
      setFundAmount('')
      setSelectedFundingCard(null)
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

  const handleAddCard = (e) => {
    e.preventDefault()
    const number = String(cardForm.cardNumber || '').replace(/\s+/g, '')
    const selectedBankName = cardForm.bankName.trim()
    if (!selectedBankName) {
      toast.error('Search and select your bank from the list')
      return
    }
    if (number.length < 12) {
      toast.error('Enter a valid card number')
      return
    }

    const newCard = {
      id: Date.now().toString(),
      bankName: selectedBankName,
      cardHolder: cardForm.cardHolder.trim() || 'Card Holder',
      last4: number.slice(-4),
      expiry: cardForm.expiry || '--/--'
    }

    persistCards([newCard, ...cards])
    setCardForm({ bankName: '', cardHolder: '', cardNumber: '', expiry: '' })
    setBankSearchQuery('')
    setShowCardModal(false)
    toast.success('Card added')
  }

  const handleDeleteCard = (cardId) => {
    const next = cards.filter((card) => card.id !== cardId)
    persistCards(next)
    if (selectedFundingCard?.id === cardId) {
      setSelectedFundingCard(null)
    }
  }

  const handleOpenFundFromCard = (card) => {
    setSelectedFundingCard(card)
    setShowFundModal(true)
  }

  const handleOpenCardModal = () => {
    setCardForm({ bankName: '', cardHolder: '', cardNumber: '', expiry: '' })
    setBankSearchQuery('')
    setShowBankDropdown(false)
    setShowCardModal(true)
  }

  const filteredBanks = useMemo(() => {
    const query = bankSearchQuery.trim().toLowerCase()
    if (!query) return NIGERIAN_BANKS.slice(0, 8)
    return NIGERIAN_BANKS.filter((bank) => bank.toLowerCase().includes(query)).slice(0, 8)
  }, [bankSearchQuery])

  const insightDetails = useMemo(() => {
    const debits = transactions.filter((tx) => tx.type === 'debit')
    const total = debits.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const average = debits.length ? total / debits.length : 0
    const byCategory = {}
    const byMerchant = {}

    debits.forEach((tx) => {
      const category = tx.category || 'OTHER'
      const amount = toNumber(tx.amount)
      const merchant = (tx.merchant || tx.description || '').trim() || 'Unknown Merchant'

      if (!byCategory[category]) {
        byCategory[category] = { category, total: 0, count: 0, merchants: {} }
      }
      byCategory[category].total += amount
      byCategory[category].count += 1
      byCategory[category].merchants[merchant] = (byCategory[category].merchants[merchant] || 0) + amount

      byMerchant[merchant] = (byMerchant[merchant] || 0) + amount
    })

    const categories = Object.values(byCategory)
      .map((item) => {
        const topMerchantEntry = Object.entries(item.merchants).sort((a, b) => b[1] - a[1])[0]
        return {
          category: item.category,
          total: item.total,
          count: item.count,
          percentage: total ? (item.total / total) * 100 : 0,
          topMerchant: topMerchantEntry ? topMerchantEntry[0] : 'Unknown Merchant'
        }
      })
      .sort((a, b) => b.total - a.total)

    const topMerchants = Object.entries(byMerchant)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return {
      total,
      average,
      topCategory: categories[0] || null,
      categories,
      topMerchants
    }
  }, [transactions])

  const leakAlerts = useMemo(() => {
    const debitTx = transactions.filter((tx) => tx.type === 'debit')
    if (!debitTx.length) return []

    const bets = debitTx.filter((tx) => (tx.category || '').toUpperCase() === 'BETTING')
    const pos = debitTx.filter((tx) => (tx.category || '').toUpperCase() === 'POS')
    const transfers = debitTx.filter((tx) => (tx.category || '').toUpperCase() === 'TRANSFER')

    const alerts = []
    const betTotal = bets.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    if (betTotal >= 5000) {
      alerts.push(`Betting spend is high this period (₦${formatCurrency(betTotal)}).`)
    }

    if (pos.length >= 5) {
      alerts.push(`Frequent POS usage (${pos.length} times). Fees may be leaking value.`)
    }

    if (transfers.length >= 8) {
      alerts.push(`You make many transfers (${transfers.length}). Track recurring destinations.`)
    }

    return alerts
  }, [transactions])

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
                  <div className="balance-head">
                    <p className="balance-label">Wallet Balance</p>
                    <button className="privacy-toggle" onClick={toggleAmountPrivacy}>
                      {showAmounts ? '🙈 Hide' : '👁 Show'}
                    </button>
                  </div>
                  <h2 className={`balance-amount ${!showAmounts ? 'masked' : ''}`}>₦{formatCurrency(balance?.walletBalance)}</h2>
                  <div className="balance-row">
                    <div className={`balance-badge ${!showAmounts ? 'masked' : ''}`}>Savings: ₦{formatCurrency(balance?.savingsBalance)}</div>
                    <div className={`balance-badge ${!showAmounts ? 'masked' : ''}`}>Total: ₦{formatCurrency(balance?.totalBalance)}</div>
                  </div>
                </div>

                <div className="action-grid">
                  <button className="action-btn" onClick={() => setActiveTab('cards')}>
                    <span>💳</span>
                    <small>Bank Cards</small>
                  </button>
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
                  {transactions.slice(0, 5).map((tx, index) => (
                    <div className="transaction-item" key={tx._id || tx.id || index}>
                      <div className={`tx-icon ${tx.type}`}>{tx.type === 'credit' ? '↓' : '↑'}</div>
                      <div className="tx-details">
                        <strong>{tx.description || tx.category}</strong>
                        <p>{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="tx-amount">
                        <strong className={`${tx.type} ${!showAmounts ? 'masked' : ''}`}>{tx.type === 'credit' ? '+' : '-'}₦{formatCurrency(tx.amount)}</strong>
                      </div>
                    </div>
                  ))}
                  {!transactions.length && <p className="empty-state">No transactions yet</p>}
                </div>
              </>
            )}

            {activeTab === 'cards' && (
              <>
                <div className="section-header">
                  <h3>Bank Cards</h3>
                  <button onClick={handleOpenCardModal} className="link-btn">+ Add Card</button>
                </div>

                <div className="cards-list">
                  {cards.map((card) => (
                    <div className="bank-card" key={card.id}>
                      <p className="bank-name">{card.bankName}</p>
                      <h4>**** **** **** {card.last4}</h4>
                      <div className="bank-card-meta">
                        <span>{card.cardHolder}</span>
                        <span>{card.expiry}</span>
                      </div>
                      <div className="goal-actions">
                        <button className="btn-small" onClick={() => handleOpenFundFromCard(card)}>Fund with Card</button>
                        <button className="btn-small-outline" onClick={() => handleDeleteCard(card.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                  {!cards.length && <p className="empty-state">No cards yet. Add one to fund your wallet faster.</p>}
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
                  {goals.map((goal, index) => (
                    <div className="goal-card" key={goal._id || goal.id || index}>
                      <div className="goal-header">
                        <h4>{goal.title}</h4>
                        <span className="goal-emoji">{goal.emoji}</span>
                      </div>
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min((toNumber(goal.currentAmount) / Math.max(toNumber(goal.targetAmount), 1)) * 100, 100)}%` }}></div>
                        </div>
                        <p className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(goal.currentAmount)} / ₦{formatCurrency(goal.targetAmount)}</p>
                      </div>
                      <div className="goal-actions">
                        <button onClick={() => setSelectedGoal({ ...goal, action: 'add', id: goal._id || goal.id })} className="btn-small">Add Money</button>
                        <button onClick={() => setSelectedGoal({ ...goal, action: 'withdraw', id: goal._id || goal.id })} className="btn-small-outline">Withdraw</button>
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
                  <p className={`total-spent ${!showAmounts ? 'masked' : ''}`}>Total Spent: ₦{formatCurrency(insightDetails.total)}</p>
                </div>

                <div className="insight-summary-grid">
                  <div className="summary-card">
                    <p>Total Debits</p>
                    <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(insightDetails.total)}</strong>
                  </div>
                  <div className="summary-card">
                    <p>Average Spend</p>
                    <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(insightDetails.average)}</strong>
                  </div>
                  <div className="summary-card">
                    <p>Top Category</p>
                    <strong>{insightDetails.topCategory?.category || 'N/A'}</strong>
                  </div>
                </div>

                <div className="section-header">
                  <h3>Leakage Watch</h3>
                </div>
                <div className="leakage-list">
                  {leakAlerts.map((alert, index) => (
                    <div className="leakage-item" key={index}>⚠️ {alert}</div>
                  ))}
                  {!leakAlerts.length && <p className="empty-state">No major leak patterns detected yet.</p>}
                </div>

                <div className="category-list">
                  {insightDetails.categories.map((cat) => (
                    <div className="category-card" key={cat.category}>
                      <div className="category-icon">{getCategoryIcon(cat.category)}</div>
                      <div className="category-details">
                        <strong>{cat.category}</strong>
                        <p>{toNumber(cat.count)} transactions · Top merchant: {cat.topMerchant}</p>
                      </div>
                      <div className="category-amount">
                        <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(cat.total)}</strong>
                        <span>{cat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                  {!insightDetails.categories.length && <p className="empty-state">No spending data yet</p>}
                </div>

                <div className="section-header">
                  <h3>Top Merchants</h3>
                </div>
                <div className="transaction-list">
                  {insightDetails.topMerchants.map((merchantItem, index) => (
                    <div className="transaction-item" key={`${merchantItem.merchant}-${index}`}>
                      <div className="tx-icon debit">↑</div>
                      <div className="tx-details">
                        <strong>{merchantItem.merchant}</strong>
                        <p>High spend destination</p>
                      </div>
                      <div className="tx-amount">
                        <strong className={`debit ${!showAmounts ? 'masked' : ''}`}>-₦{formatCurrency(merchantItem.amount)}</strong>
                      </div>
                    </div>
                  ))}
                  {!insightDetails.topMerchants.length && <p className="empty-state">No merchant pattern yet</p>}
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className="section-header">
                  <h3>All Transactions</h3>
                </div>

                <div className="transaction-list">
                  {transactions.map((tx, index) => (
                    <div className="transaction-item" key={tx._id || tx.id || index}>
                      <div className={`tx-icon ${tx.type}`}>{tx.type === 'credit' ? '↓' : '↑'}</div>
                      <div className="tx-details">
                        <strong>{tx.description || tx.category}</strong>
                        <p>{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="tx-amount">
                        <strong className={`${tx.type} ${!showAmounts ? 'masked' : ''}`}>{tx.type === 'credit' ? '+' : '-'}₦{formatCurrency(tx.amount)}</strong>
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
        <div className="modal-overlay" onClick={() => { setShowFundModal(false); setSelectedFundingCard(null) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Fund Wallet</h3>
            {selectedFundingCard && (
              <p className="modal-helper">
                Source: {selectedFundingCard.bankName} • **** {selectedFundingCard.last4}
              </p>
            )}
            <form onSubmit={handleFundWallet}>
              <input type="number" placeholder="Amount" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} required />
              <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Fund Wallet'}</button>
            </form>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="modal-overlay" onClick={() => { setShowCardModal(false); setBankSearchQuery(''); setShowBankDropdown(false) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Bank Card</h3>
            <form onSubmit={handleAddCard}>
              <div className="bank-picker">
                <input
                  placeholder="Search and select bank"
                  value={bankSearchQuery}
                  onFocus={() => setShowBankDropdown(true)}
                  onClick={() => setShowBankDropdown(true)}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    setBankSearchQuery(nextValue)
                    setShowBankDropdown(true)
                    if (cardForm.bankName && cardForm.bankName !== nextValue) {
                      setCardForm({ ...cardForm, bankName: '' })
                    }
                  }}
                  required
                />
                {showBankDropdown && (
                  <div className="bank-results">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        className={`bank-option ${cardForm.bankName === bank ? 'selected' : ''}`}
                        onClick={() => {
                          setCardForm({ ...cardForm, bankName: bank })
                          setBankSearchQuery(bank)
                          setShowBankDropdown(false)
                        }}
                      >
                        {bank}
                      </button>
                    ))}
                    {!filteredBanks.length && <p className="bank-empty">No bank matches your search</p>}
                  </div>
                )}
              </div>
              <input
                placeholder="Card Holder Name"
                value={cardForm.cardHolder}
                onFocus={() => setShowBankDropdown(false)}
                onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                required
              />
              <input
                placeholder="Card Number"
                value={cardForm.cardNumber}
                onFocus={() => setShowBankDropdown(false)}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                required
              />
              <input
                placeholder="Expiry (MM/YY)"
                value={cardForm.expiry}
                onFocus={() => setShowBankDropdown(false)}
                onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                required
              />
              <button type="submit">Save Card</button>
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
        .balance-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .balance-label { font-size: 14px; opacity: 0.9; margin: 0 0 8px; }
        .privacy-toggle { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .balance-amount { font-size: 42px; font-weight: 800; margin: 0 0 12px; }
        .balance-row { display: flex; gap: 10px; }
        .balance-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .action-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 24px; }
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
        .insight-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .summary-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 12px; }
        .summary-card p { font-size: 11px; color: #777; margin: 0 0 6px; }
        .summary-card strong { font-size: 14px; color: #1a1a1a; }
        .leakage-list { display: grid; gap: 8px; margin-bottom: 14px; }
        .leakage-item { background: #fff4f4; color: #a63b3b; border: 1px solid #ffd6d6; border-radius: 12px; padding: 10px 12px; font-size: 13px; }
        .cards-list { display: grid; gap: 14px; }
        .bank-card { background: linear-gradient(135deg, #143e63 0%, #0f2d47 100%); color: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 8px 20px rgba(15, 45, 71, 0.35); }
        .bank-name { font-size: 12px; opacity: 0.9; margin: 0 0 8px; }
        .bank-card h4 { font-size: 22px; letter-spacing: 2px; margin: 0 0 12px; }
        .bank-card-meta { display: flex; justify-content: space-between; font-size: 12px; opacity: 0.9; margin-bottom: 12px; }
        .category-list { display: grid; gap: 12px; }
        .category-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 16px; padding: 16px; display: grid; grid-template-columns: 50px 1fr auto; gap: 12px; align-items: center; }
        .category-icon { width: 50px; height: 50px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .category-details strong { font-size: 16px; color: #1a1a1a; display: block; }
        .category-details p { font-size: 12px; color: #999; margin: 4px 0 0; }
        .category-amount { text-align: right; }
        .category-amount strong { font-size: 18px; color: #1a1a1a; display: block; }
        .category-amount span { font-size: 12px; color: #666; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e5e5; display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
        .bottom-nav button { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #999; cursor: pointer; padding: 8px; }
        .bottom-nav button span { font-size: 24px; }
        .bottom-nav button small { font-size: 11px; font-weight: 600; }
        .bottom-nav button.active { color: #00A86B; }
        .masked { filter: blur(8px); user-select: none; }
        .empty-state { text-align: center; color: #999; padding: 32px 16px; font-size: 14px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #fff; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; }
        .modal-content h3 { font-size: 20px; font-weight: 700; margin: 0 0 16px; }
        .modal-helper { font-size: 13px; color: #555; margin: -6px 0 12px; }
        .modal-content input, .modal-content textarea { width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 10px; font-size: 14px; margin-bottom: 12px; }
        .bank-picker { margin-bottom: 10px; position: relative; }
        .bank-results { border: 1px solid #e5e5e5; border-radius: 10px; max-height: 170px; overflow: auto; margin: 0 0 12px; padding: 6px; background: #f8faf9; }
        .bank-option { width: 100%; text-align: left; padding: 10px 12px; border: none; border-radius: 10px; background: #fff; color: #222; cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .bank-option:last-child { margin-bottom: 0; }
        .bank-option.selected { background: #eaf8f2; color: #0b7f54; }
        .bank-empty { padding: 10px 12px; font-size: 12px; color: #777; margin: 0; }
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
