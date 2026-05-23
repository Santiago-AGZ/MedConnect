import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { CalendarCheck, Monitor, FileText, HeartPulse } from 'lucide-react'

export default function Home({ session }: { session: any }) {
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  return (
    <div>
      <section className="text-center py-16 px-6 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-text leading-tight">
          {session ? 'Bienvenido de nuevo' : 'Tu salud, más cerca que nunca'}
        </h1>
        <p className="text-lg text-secondary leading-relaxed max-w-lg mx-auto mb-8">
          Conectamos pacientes con médicos de confianza a través de videoconsultas seguras,
          sin importar dónde estés. Fácil, rápido y accesible para todos.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {session ? (
            <>
              <Link to="/schedule"><Button className="px-6 py-3 text-base">Agendar una cita</Button></Link>
              <Link to="/history"><Button variant="outline" className="px-6 py-3 text-base">Ver mi historial</Button></Link>
            </>
          ) : (
            <>
              <Link to="/register"><Button className="px-6 py-3 text-base">Crear mi cuenta gratis</Button></Link>
              <Button variant="outline" className="px-6 py-3 text-base" onClick={() => setOnboardingOpen(true)}>Cómo funciona</Button>
            </>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: CalendarCheck, title: 'Agenda tu cita', desc: 'Selecciona el médico, el día y la hora que mejor se ajusten a tu disponibilidad. Sin llamadas ni esperas.' },
          { icon: Monitor, title: 'Videoconsulta segura', desc: 'Conéctate con tu médico desde cualquier dispositivo. Sin descargas, sin complicaciones.' },
          { icon: FileText, title: 'Historial médico', desc: 'Accede a tus consultas anteriores, diagnósticos y documentos en un solo lugar, cuando los necesites.' },
        ].map((f, i) => {
          const Icon = f.icon
          return (
            <div key={i} className="bg-surface rounded-lg border border-border p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-text">{f.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
            </div>
          )
        })}
      </section>

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-2">
              <HeartPulse size={32} className="text-primary" />
            </div>
            <DialogTitle className="text-lg">Bienvenido a MedConnect</DialogTitle>
            <p className="text-sm text-secondary">En solo 4 pasos podrás conectarte con un médico.</p>
          </DialogHeader>
          <div className="text-left space-y-3">
            {[
              { n: 1, t: 'Crea tu cuenta', d: 'Regístrate con tu correo y datos básicos.', s: 'Tus datos están protegidos.' },
              { n: 2, t: 'Elige un médico', d: 'Selecciona entre nuestros profesionales.', s: 'Según tu especialidad y horario.' },
              { n: 3, t: 'Agenda tu cita', d: 'Escoge el día y la hora que prefieras.', s: 'Recibirás un recordatorio.' },
              { n: 4, t: 'Conéctate a la videollamada', d: 'Ingresa a la sala virtual y habla con tu médico.', s: 'Solo necesitas cámara y micrófono.' },
            ].map(st => (
              <div key={st.n} className="flex gap-3 items-start pb-3 border-b border-border last:border-0">
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{st.n}</span>
                <div>
                  <p className="text-sm font-semibold text-text">{st.t}</p>
                  <p className="text-xs text-secondary">{st.d}</p>
                  <p className="text-xs text-muted">{st.s}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setOnboardingOpen(false)} className="w-full">Entendido, ¡empecemos!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
