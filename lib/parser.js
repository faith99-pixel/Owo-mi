export function parseTransaction(sms) {
  const amount = extractAmount(sms)
  if (!amount) return null

  return {
    amount,
    category: categorize(sms),
    merchant: extractMerchant(sms),
    rawMessage: sms
  }
}

function extractAmount(msg) {
  // Skip balance lines
  if (/current balance|available balance|balance:/i.test(msg)) return null
  
  const patterns = [
    /Amount[\s:]+NGN\s*([,\d]+\.?\d*)/i,
    /N([,\d]+\.?\d*)/,
    /₦([,\d]+\.?\d*)/,
    /NGN\s*([,\d]+\.?\d*)/i
  ]
  for (const pattern of patterns) {
    const match = msg.match(pattern)
    if (match) return parseFloat(match[1].replace(/,/g, ''))
  }
  return null
}

function categorize(msg) {
  const lower = msg.toLowerCase()
  
  // Check for keywords in the message
  if (/gift/i.test(msg)) return 'TRANSFER'
  if (/gtworld/i.test(msg)) return 'TRANSFER'
  if (/transfer/i.test(msg)) return 'TRANSFER'
  if (/sent to|payment to/i.test(msg)) return 'TRANSFER'
  if (/bolt|uber|fuel|diesel/.test(lower)) return 'TRANSPORT'
  if (/bet9ja|sporty|bet|stake/.test(lower)) return 'BETTING'
  if (/airtime|recharge|mtn|glo|airtel/.test(lower)) return lower.includes('data') ? 'DATA' : 'AIRTIME'
  if (/pos|atm|withdrawal/.test(lower)) return 'POS'
  if (/jumia|konga/.test(lower)) return 'SHOPPING'
  if (/dstv|gotv|netflix/.test(lower)) return 'ENTERTAINMENT'
  
  return 'TRANSFER'
}

function extractMerchant(msg) {
  const patterns = [
    /TO\s+([A-Z\s]+)/i,
    /FROM\s+([A-Z\s]+)\s+TO/i,
    /at\s+([A-Za-z0-9\s*]+)/,
    /for\s+([A-Za-z0-9\s]+)/
  ]
  
  for (const pattern of patterns) {
    const match = msg.match(pattern)
    if (match) return match[1].trim().slice(0, 30)
  }
  return null
}

export function detectLeaks(transactions) {
  const leaks = []
  
  const posCount = transactions.filter(t => t.category === 'POS').length
  const posFees = posCount * 100
  if (posFees > 1000) {
    leaks.push({
      title: 'POS Charges 💸',
      amount: posFees,
      description: `You paid ₦${posFees} in POS fees (${posCount} transactions)`,
      suggestion: 'Use bank transfers instead. Save ₦100 per transaction.'
    })
  }

  const bettingTotal = transactions.filter(t => t.category === 'BETTING').reduce((sum, t) => sum + t.amount, 0)
  if (bettingTotal > 5000) {
    leaks.push({
      title: 'Betting 👀',
      amount: bettingTotal,
      description: `You spent ₦${bettingTotal.toLocaleString()} on betting`,
      suggestion: `That's ${Math.floor(bettingTotal / 500)} plates of jollof rice.`
    })
  }

  const transportTotal = transactions.filter(t => t.category === 'TRANSPORT').reduce((sum, t) => sum + t.amount, 0)
  if (transportTotal > 20000) {
    leaks.push({
      title: 'Transport Heavy 🚗',
      amount: transportTotal,
      description: `You spent ₦${transportTotal.toLocaleString()} on movement`,
      suggestion: 'Consider routes, carpool, or trek small 😅'
    })
  }

  return leaks
}
