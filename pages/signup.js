import { useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Account created! Please login.')
        router.push('/login')
      } else {
        toast.error(data.error || 'Signup failed')
      }
    } catch (error) {
      toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">💰</div>
          <h1>Create Account</h1>
          <p>Start tracking your spending today</p>
        </div>
        
        <form onSubmit={handleSignup} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="08012345678"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="auth-footer">
          <span>Already have an account?</span>
          <a href="/login">Login</a>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #00A86B 0%, #008751 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .auth-card {
          background: #fff;
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          font-size: 56px;
          margin-bottom: 16px;
        }
        .auth-header h1 {
          font-size: 32px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
        }
        .auth-header p {
          font-size: 15px;
          color: #666;
          margin: 0;
        }
        .auth-form {
          display: grid;
          gap: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-group {
          display: grid;
          gap: 8px;
        }
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        .form-group input {
          padding: 14px 16px;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #00A86B;
        }
        .btn-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #00A86B 0%, #008751 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,168,107,0.3);
          transition: transform 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #666;
        }
        .auth-footer a {
          color: #00A86B;
          font-weight: 700;
          text-decoration: none;
          margin-left: 6px;
        }
        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }
          .logo {
            font-size: 48px;
          }
          .auth-header h1 {
            font-size: 28px;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
