import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { getAppointments, getDocuments, uploadDocument, deleteDocument as deleteDocApi, cancelAppointment, saveSummary, supabase } from '../lib/api'
import { Calendar, UserRound, FileText, Plus, AlertTriangle, X, Info } from 'lucide-react'

export default function History() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [summaryModal, setSummaryModal] = useState<any>(null)
  const [summaryText, setSummaryText] = useState('')
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const load = async () => { setAppointments(await getAppointments()); setDocs(await getDocuments()) }
  useEffect(() => { load() }, [])

  const upcoming = appointments.filter(a => a.status === 'upcoming')
  const past = appointments.filter(a => a.status !== 'upcoming')

  const handleCancel = (id: string) => setConfirm({
    title: 'Cancelar cita', message: '¿Estás seguro de que deseas cancelar esta cita? Puedes reagendar después.',
    onConfirm: async () => { await cancelAppointment(id); setConfirm(null); load() }
  })
  const handleDeleteDoc = (doc: any) => setConfirm({
    title: 'Eliminar documento', message: '¿Estás seguro de eliminar este documento?',
    onConfirm: async () => { await deleteDocApi(doc.id, doc.storage_path); setConfirm(null); load() }
  })
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; await uploadDocument(file, null); load()
  }
  const openSummary = (a: any) => { setSummaryModal(a); setSummaryText(a.summary || '') }
  const saveSummaryText = async () => { if (summaryModal) { await saveSummary(summaryModal.id, summaryText); setSummaryModal(null) } }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Mi historial médico</h1>
          <p className="text-sm text-secondary">Tus consultas y documentos organizados en un solo lugar.</p>
        </div>
        <Link to="/schedule"><Button>Agendar nueva cita</Button></Link>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 mb-5">
        <h2 className="text-base font-semibold mb-1 text-text">Próximas citas</h2>
        <p className="text-xs text-secondary mb-4">
          {upcoming.length > 0 ? `Tienes ${upcoming.length} cita${upcoming.length > 1 ? 's' : ''} próxima${upcoming.length > 1 ? 's' : ''}.` : 'No tienes citas próximas.'}
        </p>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Calendar size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">Aún no hay citas</p>
            <p className="text-xs mb-4">Agenda tu primera cita médica para verla aquí.</p>
            <Link to="/schedule"><Button size="sm">Agendar cita</Button></Link>
          </div>
        ) : upcoming.map(a => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 sm:gap-4 py-3 px-4 sm:px-5 bg-white border border-border rounded-lg mb-3">
            <div className="appointment-avatar shrink-0"><UserRound size={22} className="text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-text">{a.doctors?.name}</div>
              <div className="text-xs text-secondary">{a.doctors?.specialty} &middot; {a.date} {a.time}</div>
            </div>
            <span className="badge badge-upcoming shrink-0">Próxima</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="text-xs text-secondary font-medium px-2 py-1 rounded bg-transparent border-none cursor-pointer hover:bg-bg">Reagendar</button>
              <button onClick={() => handleCancel(a.id)} className="text-xs text-error font-medium px-2 py-1 rounded bg-transparent border-none cursor-pointer hover:bg-error-light">Cancelar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 mb-5">
        <h2 className="text-base font-semibold mb-1 text-text">Consultas anteriores</h2>
        <p className="text-xs text-secondary mb-4">Revisa el resumen de tus consultas pasadas.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>{['Fecha', 'Médico', 'Especialidad', 'Motivo', 'Estado', 'Acción'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-secondary text-xs uppercase tracking-wider border-b-2 border-border">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {past.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted">Aún no hay consultas anteriores.</td></tr>
              ) : past.map(a => (
                <tr key={a.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 border-b border-border">{a.date}</td>
                  <td className="px-4 py-3 border-b border-border font-medium">{a.doctors?.name}</td>
                  <td className="px-4 py-3 border-b border-border text-secondary">{a.doctors?.specialty}</td>
                  <td className="px-4 py-3 border-b border-border text-secondary">{a.reason || '——'}</td>
                  <td className="px-4 py-3 border-b border-border">
                    <span className={`badge ${a.status === 'completed' ? 'badge-completed' : 'badge-cancelled'}`}>
                      {a.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    {a.status === 'completed' ? (
                      <button onClick={() => openSummary(a)} className="text-xs text-primary font-medium bg-transparent border-none cursor-pointer hover:underline">Ver resumen</button>
                    ) : (
                      <Link to="/schedule" className="text-xs text-primary font-medium no-underline hover:underline">Reagendar</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-text">Documentos</h2>
            <p className="text-xs text-secondary">Sube y consulta tus documentos médicos.</p>
          </div>
          <label className="px-4 py-2 rounded-md border-2 border-primary text-primary text-sm font-semibold cursor-pointer hover:bg-primary-light flex items-center gap-1.5">
            <Plus size={16} /> Subir archivo
            <input type="file" onChange={handleUpload} className="hidden" />
          </label>
        </div>
        {docs.length === 0 ? (
          <div className="text-center py-6">
            <FileText size={36} className="mx-auto mb-2 opacity-40 text-muted" />
            <p className="text-sm text-muted">Sin documentos aún. Sube tu primera receta o resultado.</p>
          </div>
        ) : docs.map(d => {
          const url = supabase.storage.from('documents').getPublicUrl(d.storage_path).data.publicUrl
          return (
            <div key={d.id} className="appointment-card mb-2">
              <div className="appointment-avatar"><FileText size={20} className="text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-text">{d.name}</div>
                <div className="text-xs text-muted">{(d.size / 1024).toFixed(1)} KB</div>
              </div>
              <a href={url} target="_blank" className="text-xs text-primary font-medium no-underline hover:underline">Descargar</a>
              <button onClick={() => handleDeleteDoc(d)} className="text-xs text-error font-medium bg-transparent border-none cursor-pointer hover:underline">Eliminar</button>
            </div>
          )
        })}
      </div>

      <Dialog open={!!summaryModal} onOpenChange={() => setSummaryModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resumen de consulta</DialogTitle></DialogHeader>
          {summaryModal && (
            <div className="space-y-3">
              <div className="summary-report">
                {[['Médico', summaryModal.doctors?.name], ['Especialidad', summaryModal.doctors?.specialty], ['Fecha', `${summaryModal.date} ${summaryModal.time}`], ['Motivo', summaryModal.reason || 'No especificado'], ['Estado', summaryModal.status === 'completed' ? 'Completada' : 'Cancelada']].map(([l, v]) => (
                  <div key={l as string} className="row"><span className="label">{l}</span><span className="value">{v}</span></div>
                ))}
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted mb-2">Notas y diagnóstico</h4>
                <textarea value={summaryText} onChange={e => setSummaryText(e.target.value)} rows={4}
                  className="w-full p-3 border border-border rounded-md text-sm font-sans resize-y box-border focus:border-primary focus:outline-none"
                  disabled={summaryModal.status !== 'completed'}
                  placeholder={summaryModal.status === 'completed' ? 'Agrega notas o diagnóstico aquí...' : 'Cita cancelada. No hay resumen disponible.'} />
                <span className="text-xs text-muted mt-1 block">Los cambios se guardan automáticamente</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummaryModal(null)}>Cerrar</Button>
            {summaryModal?.status === 'completed' && <Button onClick={saveSummaryText}>Guardar</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-error" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-text">{confirm.title}</h3>
            <p className="text-sm text-secondary mb-6">{confirm.message}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1" onClick={confirm.onConfirm}>Aceptar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
