export function exportToCSV(transactions) {
  const headers = ['Date', 'Category', 'Amount', 'Merchant', 'Description']
  const rows = transactions.map(t => [
    new Date(Date.now()).toLocaleDateString(),
    t.category,
    t.amount,
    t.merchant || 'N/A',
    t.rawMessage.substring(0, 50)
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `owomi-transactions-${Date.now()}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
