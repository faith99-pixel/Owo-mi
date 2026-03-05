import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    if (localStorage.getItem('user')) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])
  
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
}

