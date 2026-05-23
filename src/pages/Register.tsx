import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/api'
import { HeartPulse, Eye, EyeOff } from 'lucide-react'

const REQS: Record<string, (v: string) => boolean> = {
  length: (v) => v.length >= 8,
  number: (v) => /\d/.test(v),
  upper: (v) => /[A-Z]/.test(v),
  lower: (v) => /[a-z]/.test(v),
  special: (v) => /[!@#$%^&*(),.?":{}|<>_]/.test(v),
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const c = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value })
  const val = form.password
  const match = val === form.confirm && val.length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { name: form.name, phone: form.phone } }
    })
    if (authError) return setError(authError.message)
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: form.name, phone: form.phone })
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    }
    navigate('/schedule')
  }

  const inpCls = "w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border"

  return (
    <div className="flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-md p-6 sm:p-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HeartPulse size={24} className="text-primary" />
          <span className="text-lg font-bold text-primary">MedConnect</span>
        </div>

        <h1 className="text-xl font-bold mb-1 text-text">Crear mi cuenta</h1>
        <p className="text-sm text-secondary mb-7">Completa tus datos para empezar a usar MedConnect.</p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Nombre completo</label>
            <input name="name" value={form.name} onChange={c} required className={inpCls} placeholder="Ej: María García López" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Correo electrónico</label>
            <input type="email" name="email" value={form.email} onChange={c} required className={inpCls} placeholder="maria@correo.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Teléfono</label>
            <input name="phone" value={form.phone} onChange={c} required className={inpCls} placeholder="300 123 4567" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Contraseña</label>
            <div className="relative flex items-center">
              <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={c} required className={`${inpCls} pr-11`} placeholder="Crea una contraseña segura" />
              <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-secondary p-2 rounded-md hover:bg-bg transition-colors">
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <ul className="password-reqs">
              {[
                { k: 'length', l: 'Al menos 8 caracteres' },
                { k: 'number', l: 'Al menos un número' },
                { k: 'upper', l: 'Al menos una mayúscula' },
                { k: 'lower', l: 'Al menos una minúscula' },
                { k: 'special', l: 'Al menos un carácter especial (!@#$%^&*)' },
              ].map(r => (
                <li key={r.k} className={val.length > 0 ? (REQS[r.k](val) ? 'met' : 'invalid') : ''}>{r.l}</li>
              ))}
              <li className={form.confirm.length > 0 ? (match ? 'met' : 'invalid') : ''}>Ambas contraseñas coinciden</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-text">Confirmar contraseña</label>
            <div className="relative flex items-center">
              <input type={showConfirm ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={c} required className={`${inpCls} pr-11`} placeholder="Repite la contraseña" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-secondary p-2 rounded-md hover:bg-bg transition-colors">
                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-error bg-error-light p-2.5 rounded-md">{error}</p>}

          <button type="submit" className="w-full py-3 bg-primary text-white font-semibold text-base rounded-md border-none cursor-pointer hover:bg-primary-hover transition-transform active:scale-[0.97]">
            Crear mi cuenta
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-5">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary font-medium">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
