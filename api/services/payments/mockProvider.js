const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'GTBank' },
  { code: '033', name: 'UBA' },
  { code: '011', name: 'First Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '050', name: 'Ecobank' },
  { code: '090267', name: 'Kuda Bank' }
]

const pickNameSeed = (accountNumber) => {
  const seeds = ['Adebayo', 'Chinwe', 'Ibrahim', 'Efe', 'Mariam', 'Tunde', 'Amaka', 'Olamide']
  const tail = Number(String(accountNumber).slice(-1))
  return seeds[Number.isFinite(tail) ? tail % seeds.length : 0]
}

const mockProvider = {
  key: 'mock',

  listBanks() {
    return BANKS
  },

  async resolveAccount({ accountNumber, bankCode }) {
    const clean = String(accountNumber || '').replace(/\D/g, '')
    const bank = BANKS.find((b) => b.code === String(bankCode))
    if (!bank || clean.length !== 10) {
      return { success: false, error: 'Invalid bank or account number' }
    }

    return {
      success: true,
      accountName: `${pickNameSeed(clean)} ${pickNameSeed(clean + '1')}`.toUpperCase()
    }
  },

  async initiateTransfer({ reference }) {
    return {
      success: true,
      providerReference: `MOCK-OUT-${reference}`,
      status: 'pending'
    }
  },

  async checkTransferStatus() {
    return { success: true, status: 'success' }
  }
}

module.exports = { mockProvider }
