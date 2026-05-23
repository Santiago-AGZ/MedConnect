import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/api'
import { HeartPulse, LogIn, LogOut } from 'lucide-react'

export default function Navbar({ session }: { session: any }) {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/register', label: 'Registro' },
    { to: '/schedule', label: 'Agendar' },
    { to: '/video-call', label: 'Videollamada' },
    { to: '/history', label: 'Historial' },
  ]

  return (
    <header className="bg-white border-b border-border px-6 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-primary no-underline">
          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <HeartPulse size={18} />
          </span>
          MedConnect
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors ${
                location.pathname === l.to ? 'bg-primary text-white' : 'text-secondary hover:bg-primary-light hover:text-primary'
              }`}>
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <span className="text-xs text-secondary ml-2 whitespace-nowrap">
                {session.user.email?.split('@')[0]}
              </span>
              <button onClick={() => supabase.auth.signOut()}
                className="ml-1 px-3 py-1.5 rounded-md text-xs font-medium text-secondary border border-border bg-transparent cursor-pointer hover:bg-bg flex items-center gap-1">
                <LogOut size={14} /> Salir
              </button>
            </>
          ) : location.pathname !== '/login' && (
            <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-primary no-underline hover:bg-primary-light flex items-center gap-1">
              <LogIn size={14} /> Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
