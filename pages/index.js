import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    if (localStorage.getItem('user')) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router])
  
  return null
}
