import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDoctors, createAppointment } from '../lib/api'
import { Button } from '../components/ui/button'
import { Stethoscope, Info } from 'lucide-react'

export default function Schedule() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const navigate = useNavigate()
  useEffect(() => { getDoctors().then(setDoctors) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return alert('Selecciona un médico')
    try {
      const appt = await createAppointment({ doctorId: selected, date, time, reason })
      const doctor = doctors.find(d => d.id === selected)
      localStorage.setItem('mc_current_doctor', JSON.stringify({ name: doctor.name, specialty: doctor.specialty }))
      localStorage.setItem('mc_last_appointment', JSON.stringify(appt))
      navigate('/video-call')
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold mb-1 text-text">Agendar una cita</h1>
      <p className="text-sm text-secondary mb-6">Elige un médico y selecciona el horario que mejor te acomode.</p>

      <div className="steps">
        <span className="step completed"><span className="text-white text-xs">&#10003;</span></span>
        <span className="step active">2</span>
        <span className="step">3</span>
      </div>

      <form onSubmit={submit}>
        <div className="bg-surface border border-border rounded-lg p-6 mb-5">
          <h2 className="text-base font-semibold mb-1 text-text">Selecciona tu médico</h2>
          <p className="text-xs text-secondary mb-4">Todos nuestros profesionales están certificados.</p>
          <div className="doctor-grid">
            {doctors.map(d => (
              <div key={d.id} onClick={() => setSelected(d.id)}
                className={`doctor-card ${selected === d.id ? 'selected' : ''}`}>
                <div className="doctor-avatar-lg"><Stethoscope size={24} className="text-primary" /></div>
                <div className="font-semibold text-sm text-text">{d.name}</div>
                <div className="text-xs text-secondary">{d.specialty}</div>
                <div className="text-xs text-muted mt-1">{d.years_experience} años</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 mb-5">
          <h2 className="text-base font-semibold mb-1 text-text">Fecha y hora</h2>
          <p className="text-xs text-secondary mb-4">Selecciona el día y horario disponibles.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text">Fecha de la cita</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-text">Horario disponible</label>
              <select value={time} onChange={e => setTime(e.target.value)} required
                className="w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border bg-white">
                <option value="">Selecciona...</option>
                {['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 mb-5">
          <h2 className="text-base font-semibold mb-1 text-text">Motivo de la consulta</h2>
          <p className="text-xs text-secondary mb-4">Cuéntanos brevemente qué te gustaría consultar.</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            className="w-full px-3.5 py-3 border-2 border-border rounded-md text-base focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 box-border resize-y"
            placeholder="Ej: Hace una semana tengo dolor de cabeza constante..." />
        </div>

        <div className="bg-info-light border border-blue-200 rounded-md p-3.5 text-sm text-blue-800 mb-5 flex gap-2.5 items-start">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <span>Recibirás un recordatorio en tu correo 24 horas antes. Puedes cancelar desde tu historial hasta 2 horas antes.</span>
        </div>

        <Button type="submit" size="lg" className="w-full py-3.5 text-base">Agendar mi cita</Button>
      </form>
    </div>
  )
}
