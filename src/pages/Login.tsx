import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/api'
import { HeartPulse } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    navigate('/')
  }

  return (
    <div className="flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-md p-6 sm:p-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HeartPulse size={24} className="text-primary" />
          <span className="text-lg font-bold text-primary">MedConnect</span>
        </div>

        <h1 className="text-xl font-bold mb-1 text-text">Iniciar sesión</h1>
        <p className="text-sm text-secondary mb-7">Ingresa tu correo para acceder a tus citas.</p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border"
              placeholder="maria@correo.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border"
              placeholder="Tu contraseña" />
          </div>

          {error && <p className="text-sm text-error bg-error-light p-2.5 rounded-md">{error}</p>}

          <button type="submit" className="w-full py-3 bg-primary text-white font-semibold text-base rounded-md border-none cursor-pointer hover:bg-primary-hover transition-transform active:scale-[0.95]">
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-5">
          ¿No tienes cuenta? <Link to="/register" className="text-primary font-medium">Crear cuenta gratis</Link>
        </p>
      </div>
    </div>
  )
}
