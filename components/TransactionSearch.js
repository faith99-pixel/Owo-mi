import { useState } from 'react'

export default function TransactionSearch({ transactions, onFilter }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [dateRange, setDateRange] = useState('ALL')

  const handleSearch = () => {
    let filtered = transactions

    if (search) {
      filtered = filtered.filter(t => 
        t.rawMessage.toLowerCase().includes(search.toLowerCase()) ||
        (t.merchant && t.merchant.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (category !== 'ALL') {
      filtered = filtered.filter(t => t.category === category)
    }

    onFilter(filtered)
  }

  return (
    <div style={{ background: 'white', borderRadius: 15, padding: 20, marginBottom: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
      <h3 style={{ marginBottom: 15, color: '#1A1A2E' }}>🔍 Search & Filter</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, border: '2px solid #E0E0E0', borderRadius: 8, fontSize: 14 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 10, border: '2px solid #E0E0E0', borderRadius: 8, fontSize: 14 }}>
          <option value="ALL">All Categories</option>
          <option value="TRANSPORT">Transport</option>
          <option value="FOOD">Food</option>
          <option value="BETTING">Betting</option>
          <option value="TRANSFER">Transfer</option>
          <option value="SHOPPING">Shopping</option>
          <option value="ENTERTAINMENT">Entertainment</option>
        </select>
        <button onClick={handleSearch} style={{ padding: 10, background: '#00A86B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          Apply Filter
        </button>
      </div>
    </div>
  )
}
