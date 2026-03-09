import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { parseTransaction, detectLeaks } from '../lib/parser'
import { api } from '../lib/api'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'cards', label: 'Cards', icon: '💳' },
  { id: 'savings', label: 'Savings', icon: '💰' },
  { id: 'split', label: 'Split', icon: '🔄' },
  // { id: 'debts', label: 'Debts', icon: '🤝' },
  // { id: 'goals', label: 'Goals', icon: '🎯' },
  // { id: 'subs', label: 'Subs', icon: '📱' },
  // { id: 'budget', label: 'Budget', icon: '📋' },
  // { id: 'invest', label: 'Invest', icon: '📈' },
  { id: 'invoice', label: 'Invoice', icon: '📄' },
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
  const [userAvatar, setUserAvatar] = useState('/avatar-neutral.svg')
  const [virtualAccountInfo, setVirtualAccountInfo] = useState({ accountNumber: '', accountBank: '' })
  const [balance, setBalance] = useState({ walletBalance: 0, savingsBalance: 0, totalBalance: 0 })
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [insights, setInsights] = useState({ categorySpending: [], totalSpent: 0 })
  const [cards, setCards] = useState([])
  const [showFundModal, setShowFundModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [showBankTransferModal, setShowBankTransferModal] = useState(false)
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
  const [availableBanks, setAvailableBanks] = useState([])
  const [bankTransferSearchQuery, setBankTransferSearchQuery] = useState('')
  const [showBankTransferDropdown, setShowBankTransferDropdown] = useState(false)
  const bankTransferPickerRef = useRef(null)
  const [bankTransferForm, setBankTransferForm] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    amount: '',
    narration: ''
  })
  const [bankTransferStatus, setBankTransferStatus] = useState('')
  const [webhookTestLoading, setWebhookTestLoading] = useState(false)
  const [lastInboundReference, setLastInboundReference] = useState('')
  const [copiedVirtualAccount, setCopiedVirtualAccount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAmounts, setShowAmounts] = useState(true)
  const [openInsightSection, setOpenInsightSection] = useState('alerts')
  const [safeCircleEnabled, setSafeCircleEnabled] = useState(false)
  const [safeCircleInput, setSafeCircleInput] = useState('')
  const [spendCheckAmount, setSpendCheckAmount] = useState('')
  const [spendCheckCategory, setSpendCheckCategory] = useState('TRANSFER')
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)

  // New feature states
  const [expenseSplits, setExpenseSplits] = useState([])
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitForm, setSplitForm] = useState({
    title: '',
    totalAmount: '',
    category: 'food',
    participants: ''
  })
  const [splitFilter, setSplitFilter] = useState('all') // all, active, settled
  const [expandedParticipants, setExpandedParticipants] = useState({}) // Track which splits have expanded participants
  const [debts, setDebts] = useState([])
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [debtForm, setDebtForm] = useState({
    name: '',
    amount: '',
    debtType: 'owed_to_me',
    phone: ''
  })
  const [subscriptions, setSubscriptions] = useState([])
  const [showSubsModal, setShowSubsModal] = useState(false)
  const [subsForm, setSubsForm] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    nextBillingDate: ''
  })

  // Financial Goals state
  const [financialGoals, setFinancialGoals] = useState([])
  const [showFinancialGoalModal, setShowFinancialGoalModal] = useState(false)
  const [financialGoalForm, setFinancialGoalForm] = useState({
    goalType: 'savings',
    title: '',
    description: '',
    emoji: '🎯',
    targetAmount: '',
    targetDate: '',
    category: 'general'
  })
  const [contributeToGoal, setContributeToGoal] = useState(null)
  const [contributeAmount, setContributeAmount] = useState('')

  // Invoices state
  const [invoices, setInvoices] = useState([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    tax: 0,
    discount: 0,
    dueDate: '',
    notes: ''
  })

  // Load new feature data
  const loadFeatureData = async () => {
    try {
      const [splitsData, debtsData, subsData, invoicesData, goalsData] = await Promise.all([
        api.getExpenseSplits(),
        api.getDebts(),
        api.getSubscriptions(),
        api.getInvoices(),
        api.getFinancialGoals()
      ])
      setExpenseSplits(Array.isArray(splitsData) ? splitsData : [])
      setDebts(Array.isArray(debtsData) ? debtsData : [])
      setSubscriptions(Array.isArray(subsData) ? subsData : [])
      setInvoices(Array.isArray(invoicesData) ? invoicesData : [])
      setFinancialGoals(Array.isArray(goalsData) ? goalsData : [])
    } catch (error) {
      console.error('Error loading feature data:', error)
    }
  }

  // Handler for creating invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const subtotal = invoiceForm.items.reduce((sum, item) => sum + (toNumber(item.quantity) * toNumber(item.unitPrice)), 0)
      const total = subtotal + toNumber(invoiceForm.tax) - toNumber(invoiceForm.discount)
      
      await api.createInvoice({
        title: invoiceForm.title,
        clientName: invoiceForm.clientName,
        clientEmail: invoiceForm.clientEmail,
        clientPhone: invoiceForm.clientPhone,
        items: invoiceForm.items,
        tax: parseFloat(invoiceForm.tax) || 0,
        discount: parseFloat(invoiceForm.discount) || 0,
        total: total,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes
      })
      toast.success('Invoice created!')
      setShowInvoiceModal(false)
      setInvoiceForm({
        title: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        tax: 0,
        discount: 0,
        dueDate: '',
        notes: ''
      })
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  // Handler for marking invoice as paid
  const handleMarkInvoicePaid = async (invoiceId) => {
    setLoading(true)
    try {
      await api.markInvoicePaid(invoiceId)
      toast.success('Invoice marked as paid!')
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to update invoice')
    } finally {
      setLoading(false)
    }
  }

  // Add invoice item to form
  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  // Remove invoice item from form
  const removeInvoiceItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Update invoice item
  const updateInvoiceItem = (index, field, value) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Handler for creating expense split
  const handleCreateSplit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const participantNames = splitForm.participants.split(',').map(p => p.trim()).filter(Boolean)
      const participants = participantNames.map(name => ({ name }))
      await api.createExpenseSplit({
        title: splitForm.title,
        totalAmount: parseFloat(splitForm.totalAmount),
        category: splitForm.category,
        participants: participants,
        splitType: 'equal'
      })
      toast.success('Expense split created!')
      setShowSplitModal(false)
      setSplitForm({ title: '', totalAmount: '', category: 'food', participants: '' })
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to create split')
    } finally {
      setLoading(false)
    }
  }

  // Handler for settling a split
  const handleSettleSplit = async (splitId, participantIndex, participantName) => {
    setLoading(true)
    try {
      await api.settleExpenseSplit(splitId, participantIndex, participantName)
      toast.success('Marked as settled!')
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to settle')
    } finally {
      setLoading(false)
    }
  }

  // Toggle expanded state for participants in a split
  const toggleParticipants = (splitId) => {
    setExpandedParticipants(prev => ({
      ...prev,
      [splitId]: !prev[splitId]
    }))
  }

  // Handler for creating debt
  const handleCreateDebt = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createDebt({
        name: debtForm.name,
        amount: parseFloat(debtForm.amount),
        debtType: debtForm.debtType,
        phone: debtForm.phone
      })
      toast.success('Debt record added!')
      setShowDebtModal(false)
      setDebtForm({ name: '', amount: '', debtType: 'owed_to_me', phone: '' })
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to add debt')
    } finally {
      setLoading(false)
    }
  }

  // Handler for creating subscription
  const handleCreateSubscription = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createSubscription({
        name: subsForm.name,
        amount: parseFloat(subsForm.amount),
        billingCycle: subsForm.billingCycle,
        nextBillingDate: subsForm.nextBillingDate
      })
      toast.success('Subscription added!')
      setShowSubsModal(false)
      setSubsForm({ name: '', amount: '', billingCycle: 'monthly', nextBillingDate: '' })
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to add subscription')
    } finally {
      setLoading(false)
    }
  }

  // Handler for creating financial goal
  const handleCreateFinancialGoal = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createFinancialGoal({
        goalType: financialGoalForm.goalType,
        title: financialGoalForm.title,
        description: financialGoalForm.description,
        emoji: financialGoalForm.emoji,
        targetAmount: parseFloat(financialGoalForm.targetAmount),
        targetDate: financialGoalForm.targetDate,
        category: financialGoalForm.category
      })
      toast.success('Financial goal created!')
      setShowFinancialGoalModal(false)
      setFinancialGoalForm({
        goalType: 'savings',
        title: '',
        description: '',
        emoji: '🎯',
        targetAmount: '',
        targetDate: '',
        category: 'general'
      })
      loadFeatureData()
    } catch (error) {
      toast.error('Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  // Computed stats for splits
  const splitStats = useMemo(() => {
    const active = expenseSplits.filter(s => s.status !== 'settled').length
    const settled = expenseSplits.filter(s => s.status === 'settled').length
    // Calculate totals for owed/owe
    const totalOwed = expenseSplits.reduce((sum, split) => {
      if (!split.participants) return sum
      return sum + split.participants
        .filter(p => !p.isPaid && p.name !== split.ownerName)
        .reduce((s, p) => s + toNumber(p.shareAmount || 0), 0)
    }, 0)
    const totalOwe = expenseSplits.reduce((sum, split) => {
      if (!split.participants) return sum
      return sum + split.participants
        .filter(p => !p.isPaid && p.name === split.ownerName)
        .reduce((s, p) => s + toNumber(p.shareAmount || 0), 0)
    }, 0)
    return { active, settled, totalOwed, totalOwe }
  }, [expenseSplits])

  // Filtered splits based on filter
  const filteredSplits = useMemo(() => {
    if (splitFilter === 'all') return expenseSplits
    return expenseSplits.filter(s => splitFilter === 'settled' ? s.status === 'settled' : s.status !== 'settled')
  }, [expenseSplits, splitFilter])

  // Computed stats for debts
  const debtStats = useMemo(() => {
    const owedToMe = debts.filter(d => d.debtType === 'owed_to_me').reduce((sum, d) => sum + toNumber(d.amount - d.paidAmount), 0)
    const iOwe = debts.filter(d => d.debtType === 'i_owe').reduce((sum, d) => sum + toNumber(d.amount - d.paidAmount), 0)
    return { owedToMe, iOwe }
  }, [debts])

  // Computed stats for subscriptions
  const subsStats = useMemo(() => {
    const active = subscriptions.length
    const monthlyCost = subscriptions
      .filter(s => s.billingCycle === 'monthly')
      .reduce((sum, s) => sum + toNumber(s.amount), 0)
    return { active, monthlyCost }
  }, [subscriptions])

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
    const fallbackAvatar = getDefaultAvatarForGender(user.gender)
    setUserAvatar(user.profileImageUrl || fallbackAvatar)
    setVirtualAccountInfo({
      accountNumber: user.virtualAccountNumber || '',
      accountBank: user.virtualAccountBank || ''
    })
    const privacy = localStorage.getItem('owomi_show_amounts')
    if (privacy !== null) {
      setShowAmounts(privacy === 'true')
    }
    const savedSafeCircleEnabled = localStorage.getItem('owomi_safe_circle_enabled')
    if (savedSafeCircleEnabled !== null) {
      setSafeCircleEnabled(savedSafeCircleEnabled === 'true')
    }
    const savedSafeCircleMembers = localStorage.getItem('owomi_safe_circle_members')
    if (savedSafeCircleMembers) {
      setSafeCircleInput(savedSafeCircleMembers)
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
    loadFeatureData()
  }, [router])

  useEffect(() => {
    localStorage.setItem('owomi_safe_circle_enabled', String(safeCircleEnabled))
  }, [safeCircleEnabled])

  useEffect(() => {
    localStorage.setItem('owomi_safe_circle_members', safeCircleInput)
  }, [safeCircleInput])

  useEffect(() => {
    if (!showBankTransferDropdown) return
    const handleOutsideClick = (event) => {
      if (!bankTransferPickerRef.current?.contains(event.target)) {
        setShowBankTransferDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showBankTransferDropdown])

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

const handleDeleteGoal = (goalId) => {
    console.log('Delete goal clicked:', goalId)
    if (!goalId) {
      console.error('Invalid goal ID')
      return
    }
    setGoalToDelete(goalId)
    setShowDeleteGoalModal(true)
  }

  const confirmDeleteGoal = async () => {
    const goalId = goalToDelete
    if (!goalId) {
      console.log('No goal to delete')
      return
    }
    
    console.log('Confirming delete for goal:', goalId)
    setLoading(true)
    
    try {
      // Close modal immediately
      setShowDeleteGoalModal(false)
      
      // Call API first
      const result = await api.deleteGoal(goalId)
      console.log('Delete API result:', result)
      
      // Show success message
      const refundedMsg = result?.refundedAmount > 0 
        ? ` (₦${result.refundedAmount.toLocaleString()} refunded to wallet)` 
        : ''
      toast.success(`Goal deleted!${refundedMsg}`)
      
      // Clear goal to delete
      setGoalToDelete(null)
      
      // Force a complete data reload to ensure UI is in sync
      await loadData()
      
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.error || 'Failed to delete goal')
      // Reload to restore correct state
      loadData()
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

  const handleOpenBankTransferModal = async () => {
    setShowBankTransferModal(true)
    setBankTransferSearchQuery('')
    setShowBankTransferDropdown(false)
    setBankTransferStatus('')
    setBankTransferForm({
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      amount: '',
      narration: ''
    })
    try {
      const result = await api.listBanks()
      setAvailableBanks(Array.isArray(result?.banks) ? result.banks : [])
    } catch (error) {
      setAvailableBanks([])
    }
  }

  const handleResolveBankAccount = async () => {
    const accountNumber = String(bankTransferForm.accountNumber || '').replace(/\D/g, '')
    if (!bankTransferForm.bankCode || accountNumber.length !== 10) return

    setBankTransferStatus('Resolving account...')
    try {
      const result = await api.resolveBankAccount(bankTransferForm.bankCode, accountNumber)
      if (result?.error) {
        setBankTransferStatus(result.error)
        return
      }
      setBankTransferForm((prev) => ({
        ...prev,
        accountNumber,
        accountName: result.accountName || '',
        bankName: availableBanks.find((b) => b.code === prev.bankCode)?.name || prev.bankName
      }))
      setBankTransferStatus(`Account verified: ${result.accountName}`)
    } catch (error) {
      setBankTransferStatus('Account verification failed')
    }
  }

  const handleBankTransfer = async (e) => {
    e.preventDefault()
    const accountNumber = String(bankTransferForm.accountNumber || '').replace(/\D/g, '')
    const amount = Number(bankTransferForm.amount)
    if (!bankTransferForm.bankCode || !bankTransferForm.accountName || accountNumber.length !== 10 || !amount || amount <= 0) {
      toast.error('Complete bank transfer details first')
      return
    }

    setLoading(true)
    setBankTransferStatus('Submitting transfer...')
    try {
      const result = await api.transferToBank({
        bankCode: bankTransferForm.bankCode,
        bankName: bankTransferForm.bankName,
        accountNumber,
        accountName: bankTransferForm.accountName,
        amount,
        narration: bankTransferForm.narration
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success('Bank transfer initiated')
      setBankTransferStatus(`Transfer pending (${result.reference}). This usually settles in seconds.`)
      setShowBankTransferModal(false)
      loadData()
    } catch (error) {
      toast.error(error.message || 'Transfer failed')
      setBankTransferStatus(error.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
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

  const filteredTransferBanks = useMemo(() => {
    const query = bankTransferSearchQuery.trim().toLowerCase()
    if (!query) return availableBanks
    return availableBanks.filter((bank) => String(bank?.name || '').toLowerCase().includes(query))
  }, [availableBanks, bankTransferSearchQuery])

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

    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const recentDebits = debitTx.filter((tx) => {
      const createdAt = new Date(tx.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= weekMs
    })
    if (!recentDebits.length) return []

    const bets = recentDebits.filter((tx) => (tx.category || '').toUpperCase() === 'BETTING')
    const pos = recentDebits.filter((tx) => (tx.category || '').toUpperCase() === 'POS')
    const transfers = recentDebits.filter((tx) => (tx.category || '').toUpperCase() === 'TRANSFER')

    const alerts = []
    const betTotal = bets.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    if (betTotal >= 3000) {
      alerts.push(`Betting spend is high this period (N${formatCurrency(betTotal)}).`)
    }

    if (pos.length >= 3) {
      alerts.push(`Frequent POS usage (${pos.length} times). Fees may be leaking value.`)
    }

    const transferTotal = transfers.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    if (transfers.length >= 5 || transferTotal >= 10000) {
      alerts.push(`You make many transfers (${transfers.length}). Track recurring destinations.`)
    }

    const weeklyTotal = recentDebits.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const byCategory = {}
    recentDebits.forEach((tx) => {
      const category = (tx.category || 'OTHER').toUpperCase()
      byCategory[category] = (byCategory[category] || 0) + toNumber(tx.amount)
    })
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    if (topCategory && weeklyTotal >= 5000) {
      const [category, categoryTotal] = topCategory
      const ratio = categoryTotal / weeklyTotal
      if (ratio >= 0.45) {
        alerts.push(`${category} is taking ${(ratio * 100).toFixed(1)}% of your weekly spend.`)
      }
    }

    return alerts
  }, [transactions])

  const behaviorInsights = useMemo(() => {
    const debitTx = transactions.filter((tx) => tx.type === 'debit')
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const weekMs = 7 * dayMs
    const leakCategories = new Set(['BETTING', 'POS', 'TRANSFER', 'AIRTIME', 'DATA'])

    const recentDebits = debitTx.filter((tx) => {
      const createdAt = new Date(tx.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= weekMs
    })

    const previousDebits = debitTx.filter((tx) => {
      const createdAt = new Date(tx.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt > weekMs && now - createdAt <= weekMs * 2
    })

    const weeklyTotal = recentDebits.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const previousWeeklyTotal = previousDebits.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const leakTx = recentDebits.filter((tx) => leakCategories.has((tx.category || '').toUpperCase()))
    const leakSpendTotal = leakTx.reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const leakRatio = weeklyTotal ? leakSpendTotal / weeklyTotal : 0

    const bettingCount = leakTx.filter((tx) => (tx.category || '').toUpperCase() === 'BETTING').length
    const posCount = leakTx.filter((tx) => (tx.category || '').toUpperCase() === 'POS').length
    const transferCount = leakTx.filter((tx) => (tx.category || '').toUpperCase() === 'TRANSFER').length
    const airtimeDataCount = leakTx.filter((tx) => {
      const category = (tx.category || '').toUpperCase()
      return category === 'AIRTIME' || category === 'DATA'
    }).length

    const byCategory = {}
    const byMerchant = {}
    recentDebits.forEach((tx) => {
      const category = (tx.category || 'OTHER').toUpperCase()
      const amount = toNumber(tx.amount)
      const merchant = (tx.merchant || tx.description || '').trim() || 'Unknown Merchant'
      byCategory[category] = (byCategory[category] || 0) + amount
      byMerchant[merchant] = (byMerchant[merchant] || 0) + amount
    })

    const leakiestCategoryEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    const leakiestMerchantEntry = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0]

    let score = 100
    score -= Math.min(45, leakRatio * 60)
    score -= Math.min(18, bettingCount * 4)
    score -= Math.min(12, Math.max(0, posCount - 2) * 2)
    score -= Math.min(10, Math.max(0, airtimeDataCount - 3) * 2)
    score -= Math.min(10, Math.max(0, transferCount - 5))
    score = Math.max(0, Math.min(100, Math.round(score)))

    const dayBuckets = {}
    recentDebits.forEach((tx) => {
      const key = new Date(tx.createdAt).toISOString().slice(0, 10)
      const amount = toNumber(tx.amount)
      const isLeak = leakCategories.has((tx.category || '').toUpperCase())
      if (!dayBuckets[key]) dayBuckets[key] = { totalLeak: 0 }
      if (isLeak) dayBuckets[key].totalLeak += amount
    })

    let streakDays = 0
    for (let i = 0; i < 14; i += 1) {
      const date = new Date(now - i * dayMs).toISOString().slice(0, 10)
      const totalLeak = dayBuckets[date]?.totalLeak || 0
      if (totalLeak <= 1000) {
        streakDays += 1
      } else {
        break
      }
    }

    const actionableFixes = []
    if (bettingCount >= 2) actionableFixes.push('Set a weekly betting cap and block extra betting transfers after the cap.')
    if (posCount >= 4) actionableFixes.push('Reduce POS withdrawals by batching cash-outs into one larger transaction.')
    if (airtimeDataCount >= 4) actionableFixes.push('Bundle airtime/data purchases into a weekly plan to avoid repeated small spends.')
    if (transferCount >= 8) actionableFixes.push('Group frequent transfers and schedule one daily transfer window.')
    if (leakiestCategoryEntry && weeklyTotal && (leakiestCategoryEntry[1] / weeklyTotal) >= 0.35) {
      actionableFixes.push(`Cap ${leakiestCategoryEntry[0]} at 25% of weekly spend and review every Sunday.`)
    }
    if (!actionableFixes.length) {
      actionableFixes.push('Your leak pattern is stable. Keep the streak and review top merchants before each weekend.')
    }
    const trendDirection = previousWeeklyTotal > 0

      ? ((weeklyTotal - previousWeeklyTotal) / previousWeeklyTotal) * 100
      : 0
    const trendText = previousWeeklyTotal > 0
      ? `${trendDirection > 0 ? 'Up' : 'Down'} ${Math.abs(trendDirection).toFixed(1)}% vs last week`
      : 'No previous-week baseline yet'

    const shameText = [
      'Owomi Truth Report',
      `Leak Score: ${score}/100`,
      `Weekly Spend: N${formatCurrency(weeklyTotal)}`,
      `Leak Spend: N${formatCurrency(leakSpendTotal)} (${(leakRatio * 100).toFixed(1)}%)`,
      `Top Leak: ${(leakiestCategoryEntry && leakiestCategoryEntry[0]) || 'N/A'}`,
      `Top Merchant: ${(leakiestMerchantEntry && leakiestMerchantEntry[0]) || 'N/A'}`,
      `Streak: ${streakDays} low-leak day(s)`,
      '#OwomiTruthReport'
    ].join('\n')

    return {
      score,
      streakDays,
      weeklyTotal,
      leakSpendTotal,
      leakRatio,
      trendText,
      leakiestCategory: leakiestCategoryEntry ? leakiestCategoryEntry[0] : 'N/A',
      leakiestMerchant: leakiestMerchantEntry ? leakiestMerchantEntry[0] : 'N/A',
      actionableFixes,
      shameText
    }
  }, [transactions])

  const safeCircleMembers = useMemo(() => {
    return safeCircleInput
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 3)
  }, [safeCircleInput])

  const billShockGuard = useMemo(() => {
    const debitTx = transactions.filter((tx) => tx.type === 'debit')
    if (!debitTx.length) {
      return { hasAlert: false, headline: 'No debit activity yet', detail: 'Import or create transactions to activate Bill Shock Guard.' }
    }

    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const todaySpend = debitTx
      .filter((tx) => {
        const date = new Date(tx.createdAt)
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === todayKey
      })
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0)

    const weekday = now.getUTCDay()
    const historicalSameDay = debitTx.filter((tx) => {
      const date = new Date(tx.createdAt)
      if (!Number.isFinite(date.getTime())) return false
      if (date.toISOString().slice(0, 10) === todayKey) return false
      return date.getUTCDay() === weekday
    })
    const sameDayAvg = historicalSameDay.length
      ? historicalSameDay.reduce((sum, tx) => sum + toNumber(tx.amount), 0) / historicalSameDay.length
      : 0

    const ratio = sameDayAvg > 0 ? todaySpend / sameDayAvg : (todaySpend > 0 ? 1 : 0)
    const hasAlert = todaySpend > 0 && ((sameDayAvg > 0 && ratio >= 1.8) || todaySpend >= 15000)
    const headline = hasAlert
      ? `Spend spike detected: ${ratio > 0 ? ratio.toFixed(1) : '1.0'}x your usual ${now.toLocaleDateString(undefined, { weekday: 'long' })}`
      : 'No unusual spending spike detected today'
    const detail = sameDayAvg > 0
      ? `Today: N${formatCurrency(todaySpend)} vs baseline: N${formatCurrency(sameDayAvg)}`
      : `Today: N${formatCurrency(todaySpend)}. More history needed for a baseline.`

    return { hasAlert, headline, detail }
  }, [transactions])

  const feeLeakInsights = useMemo(() => {
    const debitTx = transactions.filter((tx) => tx.type === 'debit')
    const posCount = debitTx.filter((tx) => (tx.category || '').toUpperCase() === 'POS').length
    const transferCount = debitTx.filter((tx) => (tx.category || '').toUpperCase() === 'TRANSFER').length
    const atmCount = debitTx.filter((tx) => {
      const text = `${tx.description || ''} ${tx.merchant || ''}`.toUpperCase()
      return text.includes('ATM')
    }).length

    const posFees = posCount * 100
    const transferFees = transferCount * 25
    const atmFees = atmCount * 35
    const monthlyEstimate = posFees + transferFees + atmFees
    const yearlyEstimate = monthlyEstimate * 12

    return { posCount, transferCount, atmCount, monthlyEstimate, yearlyEstimate }
  }, [transactions])

  const spendCheckResult = useMemo(() => {
    const amount = toNumber(spendCheckAmount)
    const category = (spendCheckCategory || 'TRANSFER').toUpperCase()
    if (!amount) return null

    const weeklyCategorySpend = transactions
      .filter((tx) => tx.type === 'debit' && (tx.category || '').toUpperCase() === category)
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0)
    const projected = weeklyCategorySpend + amount
    const risk = projected >= 20000 || amount >= 7000 ? 'high' : projected >= 10000 ? 'medium' : 'low'

    const message = risk === 'high'
      ? `High risk: this pushes ${category} to about N${formatCurrency(projected)}.`
      : risk === 'medium'
        ? `Caution: ${category} will reach about N${formatCurrency(projected)}.`
        : `Low risk: projected ${category} spend is N${formatCurrency(projected)}.`

    return { risk, message, projected }
  }, [spendCheckAmount, spendCheckCategory, transactions])

  const goalLinkedCaps = useMemo(() => {
    if (!goals.length) return []
    const weeklySpend = behaviorInsights.weeklyTotal
    return goals.slice(0, 2).map((goal) => {
      const target = toNumber(goal.targetAmount)
      const current = toNumber(goal.currentAmount)
      const remaining = Math.max(target - current, 0)
      const suggestedWeeklyLeakCut = Math.max(1000, Math.round(Math.min(remaining / 6, weeklySpend * 0.2)))
      const weeksFaster = suggestedWeeklyLeakCut > 0 ? Math.max(1, Math.round(remaining / suggestedWeeklyLeakCut)) : 0
      return {
        id: goal._id || goal.id || goal.title,
        title: goal.title,
        suggestedWeeklyLeakCut,
        weeksFaster
      }
    })
  }, [goals, behaviorInsights.weeklyTotal])

  const cashflowForecast = useMemo(() => {
    const debitTx = transactions.filter((tx) => tx.type === 'debit')
    if (!debitTx.length) {
      return { daysLeft: null, dailyBurn: 0 }
    }
    const dailyBurn = behaviorInsights.weeklyTotal > 0 ? behaviorInsights.weeklyTotal / 7 : 0
    const wallet = toNumber(balance?.walletBalance)
    const daysLeft = dailyBurn > 0 ? Math.floor(wallet / dailyBurn) : null
    return { daysLeft, dailyBurn }
  }, [transactions, behaviorInsights.weeklyTotal, balance])

  const handleShareTruthReport = async () => {
    try {
      const report = safeCircleEnabled && safeCircleMembers.length
        ? `${behaviorInsights.shameText}\nSafe Circle: ${safeCircleMembers.join(', ')}`
        : behaviorInsights.shameText

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report)
        toast.success('Truth report copied. Share it anywhere.')
        return
      }
      toast.error('Clipboard is not available on this browser.')
    } catch (error) {
      toast.error('Failed to copy truth report')
    }
  }

  const handleCopyVirtualAccount = async () => {
    const accountNumber = virtualAccountInfo.accountNumber || ''
    if (!accountNumber) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(accountNumber)
        setCopiedVirtualAccount(true)
        setTimeout(() => setCopiedVirtualAccount(false), 1500)
        toast.success('Account number copied')
        return
      }
      toast.error('Clipboard not available')
    } catch (error) {
      toast.error('Failed to copy account number')
    }
  }

  const triggerInboundTest = async (useDuplicateReference = false) => {
    if (!virtualAccountInfo.accountNumber) {
      toast.error('No virtual account found')
      return
    }

    const reference = useDuplicateReference && lastInboundReference
      ? lastInboundReference
      : `INB-${Date.now()}`

    setWebhookTestLoading(true)
    try {
      const result = await api.simulateInboundTransfer({
        accountNumber: virtualAccountInfo.accountNumber,
        amount: 5000,
        payerName: 'Owomi Test Sender',
        reference
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      setLastInboundReference(reference)
      toast.success(useDuplicateReference ? 'Duplicate reference test sent' : 'Inbound test credit successful')
      loadData()
    } catch (error) {
      toast.error('Inbound test failed')
    } finally {
      setWebhookTestLoading(false)
    }
  }

  const toggleInsightSection = (sectionId) => {
    setOpenInsightSection((prev) => (prev === sectionId ? '' : sectionId))
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
              <img
                src={userAvatar}
                alt="User avatar"
                className="avatar-image"
                onError={(e) => {
                  e.currentTarget.src = '/avatar-neutral.svg'
                }}
              />
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
                    <span aria-hidden="true">&#128179;</span>
                    <small>Bank Cards</small>
                  </button>
                  <button className="action-btn" onClick={() => setShowFundModal(true)}>
                    <span aria-hidden="true">&#128181;</span>
                    <small>Fund Wallet</small>
                  </button>
                  <button className="action-btn" onClick={handleOpenBankTransferModal}>
                    <span aria-hidden="true">&#128184;</span>
                    <small>Transfer Bank</small>
                  </button>
                  <button className="action-btn" onClick={() => setShowSMSModal(true)}>
                    <span aria-hidden="true">&#128241;</span>
                    <small>Import SMS</small>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('savings')}>
                    <span aria-hidden="true">&#128176;</span>
                    <small>Save Money</small>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('insights')}>
                    <span aria-hidden="true">&#128202;</span>
                    <small>Insights</small>
                  </button>
                </div>

                {virtualAccountInfo.accountNumber && (
                  <div className="virtual-account-card">
                    <p>Fund via bank transfer</p>
                    <div className="va-number-row">
                      <strong>{virtualAccountInfo.accountNumber}</strong>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={handleCopyVirtualAccount}
                        aria-label="Copy account number"
                        title="Copy account number"
                      >
                        {copiedVirtualAccount ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span>{virtualAccountInfo.accountBank || 'Owomi Settlement Bank'}</span>
                    <p className="va-note">
                      Send money from your bank app to this account number.
                    </p>
                  </div>
                )}

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
                        <div className="goal-header-actions">
                          <span className="goal-emoji">{goal.emoji}</span>
                          <button onClick={() => handleDeleteGoal(goal._id || goal.id)} className="btn-delete-icon" title="Delete Goal">🗑️</button>
                        </div>
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

            {/* EXPENSE SPLIT TAB */}
            {activeTab === 'split' && (
              <>
                <div className="insights-hero">
                  <h2>🔄 Expense Split</h2>
                  <p>Split bills with friends</p>
                </div>
                
                {/* Summary Cards */}
                <div className="split-summary-grid">
                  <div className="split-summary-card owed">
                    <span className="split-summary-icon">📥</span>
                    <div>
                      <p>You are owed</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(splitStats.totalOwed)}</strong>
                    </div>
                  </div>
                  <div className="split-summary-card owe">
                    <span className="split-summary-icon">📤</span>
                    <div>
                      <p>You owe</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(splitStats.totalOwe)}</strong>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="split-actions">
                  <button className="split-action-btn primary" onClick={() => setShowSplitModal(true)}>
                    <span>➕</span> Create Split
                  </button>
                  <button className="split-action-btn" onClick={() => setSplitFilter('active')}>
                    <span>⏳</span> Pending
                  </button>
                  <button className="split-action-btn" onClick={() => setSplitFilter('settled')}>
                    <span>✅</span> Settled
                  </button>
                </div>
                
                {/* Filter indicator */}
                {splitFilter !== 'all' && (
                  <div className="split-filter-bar">
                    <span>Showing: {splitFilter === 'active' ? 'Pending' : 'Settled'}</span>
                    <button onClick={() => setSplitFilter('all')}>Show All</button>
                  </div>
                )}
                
                {/* Split Cards List */}
                <div className="split-list">
                  {filteredSplits.map((split) => (
                    <div className="split-card" key={split._id || split.id}>
                      {/* Split Header */}
                      <div className="split-card-header">
                        <div className="split-card-title">
                          <span className="split-category-emoji">
                            {split.category === 'food' ? '🍔' : split.category === 'transport' ? '🚗' : split.category === 'entertainment' ? '🎬' : split.category === 'shopping' ? '🛍️' : split.category === 'rent' ? '🏠' : split.category === 'utilities' ? '💡' : split.category === 'travel' ? '✈️' : split.category === 'events' ? '🎉' : '💰'}
                          </span>
                          <div>
                            <h4>{split.title}</h4>
                            <p className="split-meta">
                              {split.splitType === 'equal' ? 'Equal split' : split.splitType === 'percentage' ? 'By percentage' : 'Custom'} • {split.participants?.length || 0} people
                            </p>
                          </div>
                        </div>
                        <span className={`split-status ${split.status}`}>
                          {split.status === 'settled' ? '✅ Settled' : '⏳ Pending'}
                        </span>
                      </div>
                      
                      {/* Split Amount */}
                      <div className="split-card-amount">
                        <div className="split-total">
                          <span>Total</span>
                          <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(split.totalAmount)}</strong>
                        </div>
                        <div className="split-your-share">
                          <span>Your share</span>
                          <strong className={!showAmounts ? 'masked' : ''}>₦{formatCurrency(split.myShare || 0)}</strong>
                        </div>
                      </div>
                      
                      {/* Participants */}
                      <div className="split-participants">
                        <p className="split-participants-label">
                          Participants ({split.participants?.length || 0})
                          {split.participants?.length > 5 && (
                            <button 
                              className="toggle-participants-btn"
                              onClick={() => toggleParticipants(split._id || split.id)}
                            >
                              {expandedParticipants[split._id || split.id] ? 'Show less' : `Show all (${split.participants.length})`}
                            </button>
                          )}
                        </p>
                        <div className="split-participants-list">
                          {split.participants?.slice(0, expandedParticipants[split._id || split.id] ? undefined : 5).map((participant, idx) => (
                            <div 
                              key={idx} 
                              className={`split-participant ${participant.isPaid ? 'paid' : participant.name === split.ownerName ? 'owner' : ''}`}
                            >
                              <div className="split-participant-info">
                                <span className="split-participant-avatar">
                                  {participant.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                                <div className="split-participant-details">
                                  <span className="split-participant-name">
                                    {participant.name}
                                    {participant.name === split.ownerName && <span className="owner-badge">You</span>}
                                  </span>
                                  <span className="split-participant-share">
                                    {!showAmounts ? '****' : `₦${formatCurrency(participant.shareAmount)}`}
                                    {participant.sharePercentage && ` (${participant.sharePercentage}%)`}
                                  </span>
                                </div>
                              </div>
                              <button 
                                className={`split-settle-btn ${participant.isPaid ? 'settled' : ''}`}
                                onClick={() => handleSettleSplit(split._id || split.id, idx, participant.name)}
                                disabled={participant.isPaid || loading || participant.name === split.ownerName}
                              >
                                {participant.isPaid ? '✓ Paid' : participant.name === split.ownerName ? 'Owner' : 'Mark Paid'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredSplits.length && (
                    <div className="empty-split-state">
                      <span className="empty-icon">🧾</span>
                      <p>No {splitFilter !== 'all' ? splitFilter : ''} splits yet</p>
                      <button onClick={() => setShowSplitModal(true)}>Create your first split</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* DEBTS TAB */}
            {activeTab === 'debts' && (
              <>
                <div className="insights-hero">
                  <h2>🤝 Debt Tracker</h2>
                  <p>Track money owed</p>
                </div>
                <div className="info-card">
                  <p>📱 Feature coming soon!</p>
                  <p className="info-detail">Track money you've lent to friends or loans you need to repay.</p>
                </div>
                <div className="quick-stats-grid">
                  <div className="quick-stat">
                    <span className="stat-icon">📥</span>
                    <div>
                      <p>Owed to You</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦0</strong>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">📤</span>
                    <div>
                      <p>You Owe</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦0</strong>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FINANCIAL GOALS TAB */}
            {activeTab === 'goals' && (
              <>
                <div className="insights-hero">
                  <h2>🎯 Financial Goals</h2>
                  <p>Milestones & celebrations</p>
                </div>
                
                <div className="section-header">
                  <h3>Your Goals</h3>
                  <button onClick={() => setShowFinancialGoalModal(true)} className="link-btn">+ New Goal</button>
                </div>

                <div className="goals-list">
                  {financialGoals.length > 0 ? financialGoals.map((goal, index) => (
                    <div className="goal-card" key={goal._id || goal.id || index}>
                      <div className="goal-header">
                        <h4>{goal.emoji} {goal.title}</h4>
                        <span className={`goal-status ${goal.status}`}>{goal.status}</span>
                      </div>
                      {goal.description && <p className="goal-description">{goal.description}</p>}
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min((toNumber(goal.currentAmount) / Math.max(toNumber(goal.targetAmount), 1)) * 100, 100)}%` }}></div>
                        </div>
                        <p className={!showAmounts ? 'masked' : ''}>
                          ₦{formatCurrency(goal.currentAmount)} / ₦{formatCurrency(goal.targetAmount)} 
                          ({Math.round((toNumber(goal.currentAmount) / Math.max(toNumber(goal.targetAmount), 1)) * 100)}%)
                        </p>
                      </div>
                      {goal.targetDate && <p className="goal-date">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                      <div className="goal-actions">
                        <button onClick={() => { setContributeToGoal(goal); setContributeAmount(''); }} className="btn-small">Contribute</button>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <p>No financial goals yet. Create one to start tracking!</p>
                      <button onClick={() => setShowFinancialGoalModal(true)} className="btn-small">Create Goal</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === 'subs' && (
              <>
                <div className="insights-hero">
                  <h2>📱 Subscriptions</h2>
                  <p>Track recurring payments</p>
                </div>
                <div className="info-card">
                  <p>📱 Feature coming soon!</p>
                  <p className="info-detail">Track Netflix, DSTV, data plans and get reminded before renewal.</p>
                </div>
                <div className="quick-stats-grid">
                  <div className="quick-stat">
                    <span className="stat-icon">📺</span>
                    <div>
                      <p>Active Subs</p>
                      <strong>0</strong>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">💳</span>
                    <div>
                      <p>Monthly Cost</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦0</strong>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* BUDGET CAPS TAB */}
            {activeTab === 'budget' && (
              <>
                <div className="insights-hero">
                  <h2>📋 Budget Caps</h2>
                  <p>Spending limits per category</p>
                </div>
                <div className="info-card">
                  <p>📱 Feature coming soon!</p>
                  <p className="info-detail">Set weekly/monthly limits on categories and get alerts when approaching limits.</p>
                </div>
                <div className="quick-stats-grid">
                  <div className="quick-stat">
                    <span className="stat-icon">⚠️</span>
                    <div>
                      <p>Exceeded</p>
                      <strong>0</strong>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">✅</span>
                    <div>
                      <p>On Track</p>
                      <strong>0</strong>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* INVESTMENTS TAB */}
            {activeTab === 'invest' && (
              <>
                <div className="insights-hero">
                  <h2>📈 Investments</h2>
                  <p>Track your portfolio</p>
                </div>
                <div className="info-card">
                  <p>📱 Feature coming soon!</p>
                  <p className="info-detail">Track stocks, crypto, savings, and see your portfolio value.</p>
                </div>
                <div className="quick-stats-grid">
                  <div className="quick-stat">
                    <span className="stat-icon">💵</span>
                    <div>
                      <p>Total Value</p>
                      <strong className={!showAmounts ? 'masked' : ''}>₦0</strong>
                    </div>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-icon">📊</span>
                    <div>
                      <p>Returns</p>
                      <strong className="positive">+0%</strong>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* INVOICE TAB */}
            {activeTab === 'invoice' && (
              <>
                <div className="insights-hero">
                  <h2>📄 Invoices</h2>
                  <p>Generate invoices</p>
                </div>
                
                <div className="section-header">
                  <h3>Your Invoices</h3>
                  <button onClick={() => setShowInvoiceModal(true)} className="link-btn">+ New Invoice</button>
                </div>

                <div className="goals-list">
                  {invoices.length > 0 ? invoices.map((invoice, index) => (
                    <div className="goal-card" key={invoice._id || invoice.id || index}>
                      <div className="goal-header">
                        <h4>{invoice.title}</h4>
                        <span className={`goal-status ${invoice.status}`}>{invoice.status}</span>
                      </div>
                      <div className="goal-meta">
                        <p>Invoice #{invoice.invoiceNumber}</p>
                        <p>Client: {invoice.clientName}</p>
                      </div>
                      <div className="goal-progress">
                        <p className={!showAmounts ? 'masked' : ''}>
                          ₦{formatCurrency(invoice.total)}
                        </p>
                      </div>
                      {invoice.dueDate && <p className="goal-date">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
                      <div className="goal-actions">
                        {invoice.status !== 'paid' && (
                          <button onClick={() => handleMarkInvoicePaid(invoice._id)} className="btn-small">Mark Paid</button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <p>No invoices yet. Create one to get paid!</p>
                      <button onClick={() => setShowInvoiceModal(true)} className="btn-small">Create Invoice</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'insights' && (
              <>
                <div className="insights-hero">
                  <h2>Leak-First Insights</h2>
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

                <div className="truth-grid">
                  <div className="truth-card highlight">
                    <p>Money Leak Score</p>
                    <h3>{behaviorInsights.score}<small>/100</small></h3>
                    <span>{behaviorInsights.score >= 75 ? 'Strong control' : behaviorInsights.score >= 50 ? 'Needs tightening' : 'High leakage risk'}</span>
                  </div>
                  <div className="truth-card">
                    <p>Low-Leak Streak</p>
                    <h3>{behaviorInsights.streakDays}<small> day(s)</small></h3>
                    <span>Consecutive days with minimal leak spend</span>
                  </div>
                </div>

                <div className="section-header">
                  <h3>Weekly Truth Report</h3>
                  <button onClick={handleShareTruthReport} className="link-btn">Copy Shame Card</button>
                </div>
                <div className="truth-report">
                  <div className="truth-row">
                    <span>This week total</span>
                    <strong className={!showAmounts ? 'masked' : ''}>N{formatCurrency(behaviorInsights.weeklyTotal)}</strong>
                  </div>
                  <div className="truth-row">
                    <span>Leak spend</span>
                    <strong className={!showAmounts ? 'masked' : ''}>N{formatCurrency(behaviorInsights.leakSpendTotal)} ({(behaviorInsights.leakRatio * 100).toFixed(1)}%)</strong>
                  </div>
                  <div className="truth-row">
                    <span>Top leak category</span>
                    <strong>{behaviorInsights.leakiestCategory}</strong>
                  </div>
                  <div className="truth-row">
                    <span>Top leak merchant</span>
                    <strong>{behaviorInsights.leakiestMerchant}</strong>
                  </div>
                  <p className="truth-trend">{behaviorInsights.trendText}</p>
                </div>

                <div className="insight-accordion">
                  <button className={`accordion-btn ${openInsightSection === 'alerts' ? 'open' : ''}`} onClick={() => toggleInsightSection('alerts')}>
                    <span>Alerts</span>
                    <small>{leakAlerts.length ? `${leakAlerts.length} warning(s)` : 'No warnings'}</small>
                  </button>
                  <button className={`accordion-btn ${openInsightSection === 'tools' ? 'open' : ''}`} onClick={() => toggleInsightSection('tools')}>
                    <span>Tools</span>
                    <small>Fee check, spend check, caps, safe circle, forecast</small>
                  </button>
                  <button className={`accordion-btn ${openInsightSection === 'analytics' ? 'open' : ''}`} onClick={() => toggleInsightSection('analytics')}>
                    <span>Analytics</span>
                    <small>{insightDetails.categories.length} category card(s), {insightDetails.topMerchants.length} merchant signal(s)</small>
                  </button>
                </div>

                {openInsightSection === 'tools' && (
                  <>
                <div className="section-header">
                  <h3>Bill Shock Guard</h3>
                </div>
                <div className={`guard-card ${billShockGuard.hasAlert ? 'alert' : ''}`}>
                  <strong>{billShockGuard.headline}</strong>
                  <p>{billShockGuard.detail}</p>
                </div>

                <div className="section-header">
                  <h3>Fee Leak Calculator</h3>
                </div>
                <div className="fee-grid">
                  <div className="fee-item">
                    <p>Estimated monthly fees</p>
                    <strong className={!showAmounts ? 'masked' : ''}>N{formatCurrency(feeLeakInsights.monthlyEstimate)}</strong>
                    <span>POS: {feeLeakInsights.posCount}  Transfer: {feeLeakInsights.transferCount}  ATM: {feeLeakInsights.atmCount}</span>
                  </div>
                  <div className="fee-item">
                    <p>Estimated yearly fees</p>
                    <strong className={!showAmounts ? 'masked' : ''}>N{formatCurrency(feeLeakInsights.yearlyEstimate)}</strong>
                    <span>Projected at current transaction behavior</span>
                  </div>
                </div>

                <div className="section-header">
                  <h3>Before You Spend Check</h3>
                </div>
                <div className="spend-check-card">
                  <div className="spend-check-row">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={spendCheckAmount}
                      onChange={(e) => setSpendCheckAmount(e.target.value)}
                    />
                    <select value={spendCheckCategory} onChange={(e) => setSpendCheckCategory(e.target.value)}>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="BETTING">BETTING</option>
                      <option value="POS">POS</option>
                      <option value="AIRTIME">AIRTIME</option>
                      <option value="DATA">DATA</option>
                    </select>
                  </div>
                  {spendCheckResult && (
                    <p className={`spend-check-result ${spendCheckResult.risk}`}>{spendCheckResult.message}</p>
                  )}
                </div>

                <div className="section-header">
                  <h3>Goal-Linked Auto Caps</h3>
                </div>
                <div className="fix-list">
                  {goalLinkedCaps.map((goalCap) => (
                    <div className="fix-item" key={goalCap.id}>
                      <strong>{goalCap.title}</strong>
                      <p>Cut leak spending by about N{formatCurrency(goalCap.suggestedWeeklyLeakCut)} weekly to move this goal forward by about {goalCap.weeksFaster} week(s).</p>
                    </div>
                  ))}
                  {!goalLinkedCaps.length && <p className="empty-state">Create a savings goal to get auto-cap recommendations.</p>}
                </div>

                <div className="section-header">
                  <h3>Safe Circle Mode</h3>
                </div>
                <div className="safe-circle-card">
                  <label className="safe-circle-toggle">
                    <input
                      type="checkbox"
                      checked={safeCircleEnabled}
                      onChange={(e) => setSafeCircleEnabled(e.target.checked)}
                    />
                    <span>Enable accountability sharing</span>
                  </label>
                  <input
                    placeholder="Names (comma-separated, max 3)"
                    value={safeCircleInput}
                    onChange={(e) => setSafeCircleInput(e.target.value)}
                  />
                  <p>{safeCircleEnabled && safeCircleMembers.length ? `Weekly report will include: ${safeCircleMembers.join(', ')}` : 'Add 1-3 trusted people for weekly accountability.'}</p>
                </div>

                <div className="section-header">
                  <h3>Cashflow Survival Forecast</h3>
                </div>
                <div className="guard-card">
                  {cashflowForecast.daysLeft === null ? (
                    <p>No forecast yet. Add debit history to estimate wallet runway.</p>
                  ) : (
                    <>
                      <strong>{cashflowForecast.daysLeft} day(s) of runway at current leak rate</strong>
                      <p>Daily burn estimate: N{formatCurrency(cashflowForecast.dailyBurn)}</p>
                    </>
                  )}
                </div>
                  </>
                )}

                {openInsightSection === 'alerts' && (
                  <>
                <div className="section-header">
                  <h3>Leakage Watch</h3>
                </div>
                <div className="leakage-list">
                  {leakAlerts.map((alert, index) => (
                    <div className="leakage-item" key={index}>⚠️ {alert}</div>
                  ))}
                  {!leakAlerts.length && <p className="empty-state">No major leak patterns detected yet.</p>}
                </div>

                <div className="section-header">
                  <h3>Actionable Fixes</h3>
                </div>
                <div className="fix-list">
                  {behaviorInsights.actionableFixes.map((fix, index) => (
                    <div className="fix-item" key={index}>
                      <strong>Fix {index + 1}</strong>
                      <p>{fix}</p>
                    </div>
                  ))}
                </div>
                  </>
                )}

                {openInsightSection === 'analytics' && (
                  <>
                <div className="section-header">
                  <h3>Category Breakdown</h3>
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

      {showBankTransferModal && (
        <div className="modal-overlay" onClick={() => setShowBankTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Transfer To Bank</h3>
            <form onSubmit={handleBankTransfer}>
              <div className="bank-picker transfer-bank-picker" ref={bankTransferPickerRef}>
                <div className="transfer-bank-input-row">
                  <input
                    placeholder="Search and select bank"
                    value={bankTransferSearchQuery}
                    onFocus={() => setShowBankTransferDropdown(true)}
                    onChange={(e) => {
                      const value = e.target.value
                      setBankTransferSearchQuery(value)
                      setShowBankTransferDropdown(true)
                      setBankTransferForm((prev) => ({
                        ...prev,
                        bankCode: '',
                        bankName: '',
                        accountName: ''
                      }))
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="transfer-dropdown-toggle"
                    onClick={() => setShowBankTransferDropdown((prev) => !prev)}
                    aria-label={showBankTransferDropdown ? 'Close bank list' : 'Open bank list'}
                  >
                    {showBankTransferDropdown ? '▲' : '▼'}
                  </button>
                </div>
                {showBankTransferDropdown && (
                  <div className="bank-results transfer-bank-results">
                    {filteredTransferBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        className={`bank-option ${bankTransferForm.bankCode === bank.code ? 'selected' : ''}`}
                        onClick={() => {
                          setBankTransferSearchQuery(bank.name)
                          setBankTransferForm((prev) => ({
                            ...prev,
                            bankCode: bank.code,
                            bankName: bank.name,
                            accountName: ''
                          }))
                          setShowBankTransferDropdown(false)
                        }}
                      >
                        {bank.name}
                      </button>
                    ))}
                    {!filteredTransferBanks.length && <p className="bank-empty">No bank matches your search</p>}
                  </div>
                )}
              </div>
              <div className="verify-row">
                <input
                  placeholder="Account Number"
                  onFocus={() => setShowBankTransferDropdown(false)}
                  value={bankTransferForm.accountNumber}
                  onChange={(e) => setBankTransferForm((prev) => ({ ...prev, accountNumber: e.target.value, accountName: '' }))}
                  required
                />
                <button type="button" className="btn-inline" onClick={handleResolveBankAccount}>Verify</button>
              </div>
              <input
                placeholder="Account Name"
                value={bankTransferForm.accountName}
                onFocus={() => setShowBankTransferDropdown(false)}
                readOnly
                required
              />
              <input
                type="number"
                placeholder="Amount"
                onFocus={() => setShowBankTransferDropdown(false)}
                value={bankTransferForm.amount}
                onChange={(e) => setBankTransferForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
              <input
                placeholder="Narration (optional)"
                onFocus={() => setShowBankTransferDropdown(false)}
                value={bankTransferForm.narration}
                onChange={(e) => setBankTransferForm((prev) => ({ ...prev, narration: e.target.value }))}
              />
              {bankTransferStatus ? <p className="modal-helper">{bankTransferStatus}</p> : null}
              <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Send Transfer'}</button>
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

      {showDeleteGoalModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteGoalModal(false); setGoalToDelete(null) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Goal</h3>
            <p className="modal-helper">Are you sure you want to delete this goal? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-small-outline" 
                onClick={() => { setShowDeleteGoalModal(false); setGoalToDelete(null) }}
              >
                Cancel
              </button>
              <button 
                className="btn-small-danger" 
                onClick={confirmDeleteGoal}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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

      {showSplitModal && (
        <div className="modal-overlay" onClick={() => setShowSplitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Expense Split</h3>
            <form onSubmit={handleCreateSplit}>
              <input placeholder="Split title (e.g., Dinner at Eko)" value={splitForm.title} onChange={(e) => setSplitForm({ ...splitForm, title: e.target.value })} required />
              <input type="number" placeholder="Total amount" value={splitForm.totalAmount} onChange={(e) => setSplitForm({ ...splitForm, totalAmount: e.target.value })} required />
              <select value={splitForm.category} onChange={(e) => setSplitForm({ ...splitForm, category: e.target.value })}>
                <option value="food">🍔 Food</option>
                <option value="transport">🚗 Transport</option>
                <option value="entertainment">🎬 Entertainment</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="utilities">💡 Utilities</option>
                <option value="other">📦 Other</option>
              </select>
              <input placeholder="Participants (comma-separated names)" value={splitForm.participants} onChange={(e) => setSplitForm({ ...splitForm, participants: e.target.value })} required />
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Split'}</button>
            </form>
          </div>
        </div>
      )}

      {showFinancialGoalModal && (
        <div className="modal-overlay" onClick={() => setShowFinancialGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Financial Goal</h3>
            <form onSubmit={handleCreateFinancialGoal}>
              <select value={financialGoalForm.goalType} onChange={(e) => setFinancialGoalForm({ ...financialGoalForm, goalType: e.target.value })}>
                <option value="savings">💰 Savings Goal</option>
                <option value="debt">💳 Debt Payoff</option>
                <option value="purchase">🛍️ Purchase Goal</option>
              </select>
              <input placeholder="Goal Title" value={financialGoalForm.title} onChange={(e) => setFinancialGoalForm({ ...financialGoalForm, title: e.target.value })} required />
              <textarea placeholder="Description (optional)" value={financialGoalForm.description} onChange={(e) => setFinancialGoalForm({ ...financialGoalForm, description: e.target.value })} />
              <input type="number" placeholder="Target Amount" value={financialGoalForm.targetAmount} onChange={(e) => setFinancialGoalForm({ ...financialGoalForm, targetAmount: e.target.value })} required />
              <input type="date" placeholder="Target Date (optional)" value={financialGoalForm.targetDate} onChange={(e) => setFinancialGoalForm({ ...financialGoalForm, targetDate: e.target.value })} />
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Goal'}</button>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <input 
                placeholder="Invoice Title" 
                value={invoiceForm.title} 
                onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })} 
                required 
              />
              <input 
                placeholder="Client Name" 
                value={invoiceForm.clientName} 
                onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })} 
                required 
              />
              <input 
                placeholder="Client Email (optional)" 
                type="email"
                value={invoiceForm.clientEmail} 
                onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })} 
              />
              <input 
                placeholder="Client Phone (optional)" 
                value={invoiceForm.clientPhone} 
                onChange={(e) => setInvoiceForm({ ...invoiceForm, clientPhone: e.target.value })} 
              />
              
              {/* Invoice Items */}
              <div className="invoice-items-section">
                <p className="invoice-items-label">Items</p>
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="invoice-item-row">
                    <input 
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      required
                    />
                    <input 
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                      className="invoice-qty"
                    />
                    <input 
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                      className="invoice-price"
                    />
                    {invoiceForm.items.length > 1 && (
                      <button type="button" className="remove-item-btn" onClick={() => removeInvoiceItem(index)}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-item-btn" onClick={addInvoiceItem}>+ Add Item</button>
              </div>
              
              <div className="invoice-totals-row">
                <input 
                  type="number"
                  placeholder="Tax"
                  value={invoiceForm.tax}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: e.target.value })}
                  className="invoice-tax"
                />
                <input 
                  type="number"
                  placeholder="Discount"
                  value={invoiceForm.discount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                  className="invoice-discount"
                />
              </div>
              
              <input 
                type="date"
                placeholder="Due Date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} 
              />
              <textarea 
                placeholder="Notes (optional)"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} 
              />
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Invoice'}</button>
            </form>
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
        .avatar-btn { width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: #fff; font-weight: 700; font-size: 18px; cursor: pointer; overflow: hidden; padding: 0; }
        .avatar-image { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tab-content { flex: 1; padding: 20px; overflow-y: auto; padding-bottom: 100px; }
        .balance-card { background: linear-gradient(135deg, #00A86B 0%, #008751 100%); border-radius: 20px; padding: 24px; color: #fff; box-shadow: 0 8px 24px rgba(0,168,107,0.3); margin-bottom: 20px; }
        .balance-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .balance-label { font-size: 14px; opacity: 0.9; margin: 0 0 8px; }
        .privacy-toggle { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .balance-amount { font-size: 42px; font-weight: 800; margin: 0 0 12px; }
        .balance-row { display: flex; gap: 10px; }
        .balance-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .action-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 24px; }
        .action-btn { background: #f9f9f9; border: 2px solid #e5e5e5; border-radius: 16px; padding: 12px 8px; min-height: 92px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .action-btn span { font-size: 24px; }
        .action-btn small { font-size: 11px; font-weight: 600; color: #333; }
        .virtual-account-card { background: #f4fbf8; border: 2px dashed #8ed6bb; border-radius: 14px; padding: 12px; margin: -8px 0 18px; }
        .virtual-account-card p { margin: 0 0 4px; font-size: 12px; color: #0b7f54; font-weight: 700; text-transform: uppercase; }
        .va-number-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .virtual-account-card strong { display: block; font-size: 22px; letter-spacing: 1px; color: #114d38; }
        .virtual-account-card span { font-size: 12px; color: #3f6d5b; }
        .va-note { margin: 8px 0 0; font-size: 12px !important; font-weight: 500 !important; text-transform: none !important; color: #4f6f62 !important; line-height: 1.4; }
        .va-last-ref { margin: 8px 0 0; font-size: 11px; color: #678477; word-break: break-all; }
        .copy-btn { min-width: 68px; height: 36px; border-radius: 10px; border: 1px solid #8ed6bb; background: #fff; color: #0b7f54; font-size: 12px; font-weight: 800; cursor: pointer; padding: 0 10px; }
        .va-actions { display: flex; gap: 8px; margin-top: 10px; }
        .va-actions .btn-small, .va-actions .btn-small-outline { width: auto; padding: 8px 10px; font-size: 12px; }
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
        .goal-header-actions { display: flex; align-items: center; gap: 8px; }
        .goal-emoji { font-size: 32px; }
        .btn-delete-icon { background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px; opacity: 0.7; }
        .btn-delete-icon:hover { opacity: 1; }
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
        .btn-small-danger { padding: 10px; background: #fff; color: #c62828; border: 2px solid #c62828; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .goal-delete-action { margin-top: 10px; }
        .insights-hero { text-align: center; margin-bottom: 24px; }
        .insights-hero h2 { font-size: 28px; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
        .total-spent { font-size: 20px; color: #00A86B; font-weight: 700; }
        .btn-disabled { opacity: 0.6; cursor: not-allowed; }
        .participants-list { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e5e5; }
        .participants-label { font-size: 12px; font-weight: 600; color: #666; margin: 0 0 8px; }
        .participant-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #f9f9f9; border-radius: 8px; margin-bottom: 6px; }
        .participant-row.paid { background: #e8f5e9; }
        .participant-info { display: flex; flex-direction: column; }
        .participant-name { font-size: 13px; font-weight: 600; color: #333; }
        .participant-amount { font-size: 12px; color: #666; }
        .insight-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .summary-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 12px; }
        .summary-card p { font-size: 11px; color: #777; margin: 0 0 6px; }
        .summary-card strong { font-size: 14px; color: #1a1a1a; }
        .quick-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .quick-stat { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .quick-stat .stat-icon { font-size: 28px; }
        .quick-stat div { flex: 1; }
        .quick-stat p { font-size: 12px; color: #777; margin: 0 0 4px; }
        .quick-stat strong { font-size: 18px; color: #1a1a1a; }
        .info-card { background: #f8f9fa; border: 2px dashed #ccc; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 20px; }
        .info-card p { font-size: 16px; font-weight: 600; color: #333; margin: 0 0 8px; }
        .info-card .info-detail { font-size: 13px; color: #666; margin: 0; }
        .insight-accordion { display: grid; gap: 10px; margin-bottom: 14px; }
        .accordion-btn { width: 100%; border: 2px solid #e5e5e5; background: #fff; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; text-align: left; cursor: pointer; }
        .accordion-btn span { font-size: 15px; font-weight: 800; color: #1a1a1a; }
        .accordion-btn small { font-size: 11px; color: #777; }
        .accordion-btn.open { border-color: #8ed6bb; background: #f3fbf7; }
        .accordion-panel { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 4px 12px 12px; }
        .truth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .truth-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 14px; }
        .truth-card.highlight { background: linear-gradient(135deg, #0d9a65 0%, #0a7f54 100%); border-color: transparent; color: #fff; }
        .truth-card p { font-size: 11px; margin: 0 0 8px; opacity: 0.9; }
        .truth-card h3 { margin: 0; font-size: 24px; line-height: 1; }
        .truth-card h3 small { font-size: 12px; margin-left: 4px; opacity: 0.8; }
        .truth-card span { font-size: 12px; display: block; margin-top: 8px; color: #555; }
        .truth-card.highlight span { color: rgba(255, 255, 255, 0.9); }
        .truth-report { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 12px; margin-bottom: 16px; }
        .truth-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #ececec; font-size: 13px; color: #555; }
        .truth-row:last-of-type { border-bottom: none; }
        .truth-row strong { color: #1a1a1a; text-align: right; }
        .truth-trend { margin: 10px 0 0; font-size: 12px; color: #0a7f54; font-weight: 700; }
        .guard-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 12px; margin-bottom: 14px; }
        .guard-card.alert { border-color: #f6b0b0; background: #fff7f7; }
        .guard-card strong { font-size: 14px; color: #222; display: block; }
        .guard-card p { margin: 6px 0 0; font-size: 13px; color: #555; }
        .fee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .fee-item { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 12px; }
        .fee-item p { margin: 0 0 4px; font-size: 12px; color: #666; }
        .fee-item strong { font-size: 18px; color: #111; }
        .fee-item span { display: block; margin-top: 6px; font-size: 11px; color: #777; }
        .spend-check-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 12px; margin-bottom: 14px; }
        .spend-check-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .spend-check-row input, .spend-check-row select { width: 100%; border: 2px solid #e5e5e5; border-radius: 10px; font-size: 13px; padding: 10px; }
        .spend-check-result { margin: 10px 0 0; font-size: 12px; font-weight: 700; }
        .spend-check-result.low { color: #0b7f54; }
        .spend-check-result.medium { color: #a66c00; }
        .spend-check-result.high { color: #a63b3b; }
        .safe-circle-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 12px; margin-bottom: 14px; }
        .safe-circle-toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #222; margin-bottom: 10px; }
        .safe-circle-card input[type='text'], .safe-circle-card input[type='email'], .safe-circle-card input:not([type='checkbox']) { width: 100%; border: 2px solid #e5e5e5; border-radius: 10px; font-size: 13px; padding: 10px; margin-bottom: 8px; }
        .safe-circle-card p { margin: 0; font-size: 12px; color: #666; }
        .leakage-list { display: grid; gap: 8px; margin-bottom: 14px; }
        .leakage-item { background: #fff4f4; color: #a63b3b; border: 1px solid #ffd6d6; border-radius: 12px; padding: 10px 12px; font-size: 13px; }
        .fix-list { display: grid; gap: 10px; margin-bottom: 14px; }
        .fix-item { background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; padding: 12px; }
        .fix-item strong { font-size: 12px; color: #0a7f54; display: block; margin-bottom: 4px; }
        .fix-item p { margin: 0; font-size: 13px; color: #444; }
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
.bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e5e5; display: grid; grid-template-columns: repeat(7, 1fr); padding: 4px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
        .bottom-nav button { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 2px; color: #999; cursor: pointer; padding: 4px; }
        .bottom-nav button span { font-size: 24px; }
        .bottom-nav button small { font-size: 11px; font-weight: 600; }
        .bottom-nav button.active { color: #00A86B; }
        .masked { filter: blur(8px); user-select: none; }
        .empty-state { text-align: center; color: #999; padding: 32px 16px; font-size: 14px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #fff; border-radius: 20px; padding: 24px; max-width: 400px; width: 100%; }
        .modal-content h3 { font-size: 20px; font-weight: 700; margin: 0 0 16px; }
        .modal-helper { font-size: 13px; color: #555; margin: -6px 0 12px; }
        .modal-content input, .modal-content textarea, .modal-content select { width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 10px; font-size: 14px; margin-bottom: 12px; background: #fff; }
        .verify-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start; }
        .btn-inline { width: auto !important; min-width: 86px; padding: 12px 10px !important; border-radius: 10px !important; font-size: 12px !important; }
        .bank-picker { margin-bottom: 10px; position: relative; }
        .bank-results { border: 1px solid #e5e5e5; border-radius: 10px; max-height: 170px; overflow: auto; margin: 0 0 12px; padding: 6px; background: #f8faf9; }
        .transfer-bank-picker { margin-bottom: 12px; position: relative; }
        .transfer-bank-input-row { position: relative; }
        .transfer-bank-input-row input { margin-bottom: 0; padding-right: 42px; }
        .transfer-dropdown-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 30px !important; min-width: 30px !important; height: 30px; border: none; border-radius: 8px !important; background: #f2f4f3 !important; color: #1f4235; font-size: 12px; padding: 0 !important; cursor: pointer; }
        .transfer-bank-results { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 40; max-height: 220px; overflow-y: auto; margin: 0; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15); }
        .transfer-bank-results::-webkit-scrollbar { width: 8px; }
        .transfer-bank-results::-webkit-scrollbar-track { background: #ecf4ef; border-radius: 8px; }
        .transfer-bank-results::-webkit-scrollbar-thumb { background: #9ccfb8; border-radius: 8px; }
        .transfer-bank-results::-webkit-scrollbar-thumb:hover { background: #86c1a6; }
        .bank-option { width: 100%; text-align: left; padding: 10px 12px; border: none; border-radius: 10px; background: #fff; color: #222; cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .bank-option:last-child { margin-bottom: 0; }
        .bank-option.selected { background: #eaf8f2; color: #0b7f54; }
        .bank-empty { padding: 10px 12px; font-size: 12px; color: #777; margin: 0; }
        .modal-content textarea { min-height: 120px; resize: vertical; }
        .modal-content button { width: 100%; padding: 14px; background: #00A86B; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .modal-content button:disabled { opacity: 0.6; }
        @media (min-width: 520px) {
          .action-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        @media (max-width: 480px) {
          .truth-grid { grid-template-columns: 1fr; }
          .fee-grid { grid-template-columns: 1fr; }
          .spend-check-row { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) {
          .app-wrapper { padding: 24px; }
          .mobile-view { border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
          .bottom-nav { position: sticky; }
        }
        /* Split Tab Styles */
        .split-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .split-summary-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; }
        .split-summary-card.owed { border-color: #8ed6bb; }
        .split-summary-card.owe { border-color: #f6b0b0; }
        .split-summary-icon { font-size: 28px; }
        .split-summary-card p { font-size: 12px; color: #777; margin: 0 0 4px; }
        .split-summary-card strong { font-size: 18px; color: #1a1a1a; }
        .split-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .split-action-btn { padding: 12px; background: #fff; border: 2px solid #e5e5e5; border-radius: 12px; font-size: 13px; font-weight: 600; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .split-action-btn.primary { background: #00A86B; border-color: #00A86B; color: #fff; }
        .split-action-btn:hover { border-color: #00A86B; }
        .split-filter-bar { display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; font-size: 13px; }
        .split-filter-bar span { color: #666; }
        .split-filter-bar button { background: none; border: none; color: #00A86B; font-weight: 600; cursor: pointer; }
        .split-list { display: grid; gap: 14px; }
        .split-card { background: #fff; border: 2px solid #e5e5e5; border-radius: 16px; padding: 16px; }
        .split-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .split-card-title { display: flex; gap: 12px; align-items: center; }
        .split-category-emoji { font-size: 24px; }
        .split-card-title h4 { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
        .split-meta { font-size: 12px; color: #777; margin: 0; }
        .split-status { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .split-status.pending { background: #fff8e6; color: #a66c00; }
        .split-status.settled { background: #e8f5e9; color: #2e7d32; }
        .split-card-amount { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 12px; margin-bottom: 14px; }
        .split-total, .split-your-share { text-align: center; }
        .split-card-amount span { font-size: 12px; color: #777; display: block; margin-bottom: 4px; }
        .split-card-amount strong { font-size: 16px; color: #1a1a1a; }
        .split-participants-label { font-size: 12px; font-weight: 600; color: #666; margin: 0 0 10px; display: flex; justify-content: space-between; align-items: center; }
        .toggle-participants-btn { background: none; border: none; color: #00A86B; font-size: 11px; font-weight: 600; cursor: pointer; padding: 4px 8px; margin-left: 8px; }
        .toggle-participants-btn:hover { text-decoration: underline; }
        .split-participants-list { display: grid; gap: 8px; }
        .split-participant { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f9f9f9; border-radius: 10px; }
        .split-participant.paid { background: #e8f5e9; }
        .split-participant.owner { background: #f0f7ff; }
        .split-participant-info { display: flex; align-items: center; gap: 10px; }
        .split-participant-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e5e5e5; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #666; }
        .split-participant-details { display: flex; flex-direction: column; }
        .split-participant-name { font-size: 13px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 6px; }
        .owner-badge { font-size: 10px; background: #00A86B; color: #fff; padding: 2px 6px; border-radius: 10px; }
        .split-participant-share { font-size: 12px; color: #666; }
        .split-settle-btn { padding: 8px 14px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; background: #00A86B; color: #fff; }
        .split-settle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .split-settle-btn.settled { background: #2e7d32; }
        .empty-split-state { text-align: center; padding: 32px 16px; background: #f8f9fa; border-radius: 16px; }
        .empty-split-state .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
        .empty-split-state p { font-size: 14px; color: #666; margin: 0 0 14px; }
        .empty-split-state button { padding: 12px 24px; background: #00A86B; color: #fff; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
        /* Invoice Modal Styles */
        .invoice-items-section { margin-bottom: 12px; }
        .invoice-items-label { font-size: 14px; font-weight: 600; color: #333; margin: 0 0 10px; }
        .invoice-item-row { display: grid; grid-template-columns: 1fr 60px 80px 36px; gap: 6px; margin-bottom: 8px; align-items: start; }
        .invoice-item-row input { margin-bottom: 0; }
        .invoice-qty, .invoice-price { width: 100%; padding: 10px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 13px; }
        .remove-item-btn { width: 36px; height: 36px; padding: 0; background: #ffebee; color: #c62828; border: none; border-radius: 8px; font-size: 18px; font-weight: 700; cursor: pointer; }
        .add-item-btn { width: 100%; padding: 10px; background: #f5f5f5; color: #333; border: 2px dashed #ccc; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px; }
        .add-item-btn:hover { background: #f0f0f0; }
        .invoice-totals-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .invoice-tax, .invoice-discount { width: 100%; padding: 10px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 13px; }
        .goal-meta { margin-bottom: 12px; }
        .goal-meta p { font-size: 13px; color: #666; margin: 4px 0; }
        .goal-date { font-size: 12px; color: #777; margin-top: 8px; }
        .goal-status { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .goal-status.paid { background: #e8f5e9; color: #2e7d32; }
.goal-status.pending { background: #fff8e6; color: #a66c00; }
        .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
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


function getDefaultAvatarForGender(gender) {
  if ((gender || '').toLowerCase() === 'female') return '/avatar-female.svg'
  if ((gender || '').toLowerCase() === 'male') return '/avatar-male.svg'
  return '/avatar-neutral.svg'
}

