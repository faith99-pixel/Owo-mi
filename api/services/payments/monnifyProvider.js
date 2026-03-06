const axios = require('axios')
const crypto = require('crypto')

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com/api/v1'
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || ''
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ''
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || ''
const MONNIFY_SOURCE_ACCOUNT_NUMBER = process.env.MONNIFY_SOURCE_ACCOUNT_NUMBER || ''
const MONNIFY_ORIGIN = MONNIFY_BASE_URL.replace(/\/api\/v1\/?$/i, '')

let tokenCache = { token: '', expiresAt: 0 }

const request = axios.create({
  baseURL: MONNIFY_BASE_URL,
  timeout: 15000
})

const toMillis = (seconds) => Number(seconds || 0) * 1000

const getAuthToken = async () => {
  const now = Date.now()
  if (tokenCache.token && tokenCache.expiresAt > now + 10_000) {
    return tokenCache.token
  }

  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error('Missing MONNIFY_API_KEY or MONNIFY_SECRET_KEY')
  }

  const basic = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64')
  const response = await request.post('/auth/login', null, {
    headers: { Authorization: `Basic ${basic}` }
  })

  const body = response.data?.responseBody || {}
  tokenCache = {
    token: body.accessToken || '',
    expiresAt: now + toMillis(body.expiresIn || 3500)
  }

  if (!tokenCache.token) {
    throw new Error('Monnify auth token not returned')
  }
  return tokenCache.token
}

const withBearer = async () => {
  const token = await getAuthToken()
  return { headers: { Authorization: `Bearer ${token}` } }
}

const normalizeError = (error) => {
  const apiMessage = error?.response?.data?.responseMessage || error?.response?.data?.message
  return apiMessage || error.message || 'Monnify request failed'
}

const monnifyProvider = {
  key: 'monnify',

  async listBanks() {
    try {
      const config = await withBearer()
      const response = await request.get('/banks', config)
      const banks = Array.isArray(response.data?.responseBody) ? response.data.responseBody : []
      return banks.map((b) => ({
        code: String(b.code || b.bankCode || ''),
        name: b.name || b.bankName || 'Unknown Bank'
      })).filter((b) => b.code && b.name)
    } catch {
      return []
    }
  },

  async resolveAccount({ accountNumber, bankCode }) {
    try {
      const config = await withBearer()
      const response = await request.get('/disbursements/account/validate', {
        ...config,
        params: { accountNumber, bankCode }
      })
      const body = response.data?.responseBody || {}
      return {
        success: true,
        accountName: body.accountName || body.accountHolderName || ''
      }
    } catch (error) {
      return { success: false, error: normalizeError(error) }
    }
  },

  async initiateTransfer({ reference, bankCode, accountNumber, accountName, amount, narration }) {
    try {
      if (!MONNIFY_SOURCE_ACCOUNT_NUMBER) {
        return { success: false, error: 'Set MONNIFY_SOURCE_ACCOUNT_NUMBER in api/.env for disbursements.' }
      }

      const config = await withBearer()
      const payload = {
        amount,
        reference,
        narration: narration || `Transfer ${reference}`,
        destinationBankCode: bankCode,
        destinationAccountNumber: accountNumber,
        destinationAccountName: accountName,
        currency: 'NGN',
        sourceAccountNumber: MONNIFY_SOURCE_ACCOUNT_NUMBER,
        async: true
      }

      const response = await request.post(`${MONNIFY_ORIGIN}/api/v2/disbursements/single`, payload, config)
      const body = response.data?.responseBody || {}
      return {
        success: true,
        providerReference: body.transactionReference || body.reference || reference,
        status: 'pending'
      }
    } catch (error) {
      return { success: false, error: normalizeError(error) }
    }
  },

  async checkTransferStatus({ reference }) {
    try {
      const config = await withBearer()
      const response = await request.get(`${MONNIFY_ORIGIN}/api/v2/disbursements/single/summary`, {
        ...config,
        params: { reference }
      })
      const body = response.data?.responseBody || {}
      const status = String(body.status || '').toUpperCase()
      if (status.includes('SUCCESS')) return { success: true, status: 'success' }
      if (status.includes('FAIL')) return { success: true, status: 'failed' }
      return { success: true, status: 'pending' }
    } catch (error) {
      return { success: false, error: normalizeError(error) }
    }
  },

  async createVirtualAccount({ userId, email, firstName, lastName }) {
    try {
      if (!MONNIFY_CONTRACT_CODE) {
        return { success: false, error: 'Missing MONNIFY_CONTRACT_CODE' }
      }

      const config = await withBearer()
      const accountReference = `OWOMI-${userId}-${Date.now()}`
      const accountName = `${firstName} ${lastName}`.trim()
      const payload = {
        accountReference,
        accountName,
        currencyCode: 'NGN',
        contractCode: MONNIFY_CONTRACT_CODE,
        customerEmail: email,
        customerName: accountName,
        getAllAvailableBanks: true
      }

      const response = await request.post('/bank-transfer/reserved-accounts', payload, config)
      const body = response.data?.responseBody || {}
      const preferredBank = Array.isArray(body.accounts) ? body.accounts[0] : null

      return {
        success: true,
        accountNumber: preferredBank?.accountNumber || body.accountNumber || '',
        accountBank: preferredBank?.bankName || body.bankName || 'Monnify Settlement Bank',
        accountName: preferredBank?.accountName || body.accountName || accountName
      }
    } catch (error) {
      return { success: false, error: normalizeError(error) }
    }
  },

  verifyWebhookSignature(rawBody, signature) {
    if (!MONNIFY_SECRET_KEY) return false
    if (!rawBody || !signature) return false
    const lowerSignature = String(signature).toLowerCase()
    const hmacHash = crypto.createHmac('sha512', MONNIFY_SECRET_KEY).update(rawBody, 'utf8').digest('hex').toLowerCase()
    const plainHash = crypto.createHash('sha512').update(`${rawBody}${MONNIFY_SECRET_KEY}`, 'utf8').digest('hex').toLowerCase()
    return lowerSignature === hmacHash || lowerSignature === plainHash
  }
}

module.exports = { monnifyProvider }
