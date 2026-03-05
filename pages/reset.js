import { useState } from 'react'

export default function Reset() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Reset Password</h1>
      {sent ? (
        <p>Check your email for reset instructions.</p>
      ) : (
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 10, marginBottom: 10, fontSize: 16 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10, fontSize: 16, cursor: 'pointer' }}>
            Send Reset Link
          </button>
        </form>
      )}
      <p style={{ textAlign: 'center', marginTop: 20 }}>
        <a href="/login">Back to Login</a>
      </p>
    </div>
  )
}
