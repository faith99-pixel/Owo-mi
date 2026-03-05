import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function SpendingCharts({ categorySpending }) {
  const data = Object.entries(categorySpending).map(([name, value]) => ({ name, value }))
  const COLORS = ['#00A86B', '#FDB913', '#E63946', '#06D6A0', '#667eea', '#764ba2', '#f093fb']

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 30, marginBottom: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <h2 style={{ fontSize: 24, marginBottom: 20, color: '#1A1A2E' }}>📊 Spending Breakdown</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
        <div>
          <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#666' }}>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 style={{ textAlign: 'center', marginBottom: 15, color: '#666' }}>Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#00A86B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
