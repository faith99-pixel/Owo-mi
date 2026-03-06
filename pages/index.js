import { useEffect } from 'react'
import { useRouter } from 'next/router'
import SplashScreen from '../components/SplashScreen'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    if (localStorage.getItem('user')) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])
  
  return <SplashScreen label="Owomi" />
}
