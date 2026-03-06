const { mockProvider } = require('./mockProvider')
const { monnifyProvider } = require('./monnifyProvider')

const providers = {
  mock: mockProvider,
  monnify: monnifyProvider
}

const getProvider = () => {
  const providerKey = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase()
  return providers[providerKey] || mockProvider
}

module.exports = { getProvider }
