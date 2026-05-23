import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/api'
import { HeartPulse, LogIn, LogOut, Menu, X } from 'lucide-react'

export default function Navbar({ session }: { session: any }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/register', label: 'Registro' },
    { to: '/schedule', label: 'Agendar' },
    { to: '/video-call', label: 'Videollamada' },
    { to: '/history', label: 'Historial' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white border-b border-border px-4 sm:px-6 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary no-underline" onClick={() => setOpen(false)}>
          <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <HeartPulse size={18} />
          </span>
          MedConnect
        </Link>

        <button onClick={() => setOpen(!open)} className="sm:hidden p-2 rounded-md text-secondary hover:bg-bg cursor-pointer border-none" aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors ${
                isActive(l.to) ? 'bg-primary text-white' : 'text-secondary hover:bg-primary-light hover:text-primary'
              }`}>
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <span className="text-xs text-secondary ml-2 whitespace-nowrap">{session.user.email?.split('@')[0]}</span>
              <button onClick={() => supabase.auth.signOut()}
                className="ml-1 px-3 py-1.5 rounded-md text-xs font-medium text-secondary border border-border bg-transparent cursor-pointer hover:bg-bg flex items-center gap-1">
                <LogOut size={14} /> Salir
              </button>
            </>
          ) : !isActive('/login') && (
            <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-primary no-underline hover:bg-primary-light flex items-center gap-1">
              <LogIn size={14} /> Entrar
            </Link>
          )}
        </nav>
      </div>

      {open && (
        <div className="sm:hidden border-t border-border bg-white pb-3 pt-2 px-2 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium no-underline transition-colors ${
                isActive(l.to) ? 'bg-primary text-white' : 'text-secondary hover:bg-primary-light'
              }`}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-border pt-2 mt-2">
            {session ? (
              <div className="space-y-1 px-1">
                <span className="block text-xs text-secondary px-2">{session.user.email}</span>
                <button onClick={() => { supabase.auth.signOut(); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-error hover:bg-error-light cursor-pointer border-none">
                  Cerrar sesion
                </button>
              </div>
            ) : !isActive('/login') && (
              <Link to="/login" onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-primary no-underline hover:bg-primary-light">
                Iniciar sesion
              </Link>
            )}
            {!session && !isActive('/register') && (
              <Link to="/register" onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-primary no-underline hover:bg-primary-light">
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
