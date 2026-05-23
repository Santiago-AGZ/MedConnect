import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/api'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Schedule from './pages/Schedule'
import VideoCall from './pages/VideoCall'
import History from './pages/History'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-secondary">Cargando...</div>

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar session={session} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home session={session} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedule" element={session ? <Schedule /> : <Login />} />
            <Route path="/video-call" element={session ? <VideoCall /> : <Login />} />
            <Route path="/history" element={session ? <History /> : <Login />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
