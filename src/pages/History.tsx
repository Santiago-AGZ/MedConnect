import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { getAppointments, getDocuments, uploadDocument, deleteDocument as deleteDocApi, cancelAppointment, saveSummary, supabase } from '../lib/api'
import { Calendar, UserRound, FileText, Plus, AlertTriangle, Download } from 'lucide-react'

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
  const saveSummaryText = async () => {
    if (summaryModal) { await saveSummary(summaryModal.id, summaryText); setSummaryModal(null) }
  }

  const downloadPDF = async (appt: any) => {
    try {
      const summary = appt.summary || ''
      const date = new Date().toLocaleDateString('es-CO')
      const content = summary.split('\n').map(l => {
        if (l.startsWith('MedConnect')) return `<h1 style="color:#0D9488;font-size:22px;margin:0 0 4px;">${l}</h1>`
        if (l.endsWith(':')) return `<h3 style="font-size:13px;text-transform:uppercase;color:#0D9488;letter-spacing:1px;margin:16px 0 6px;">${l}</h3>`
        if (l.trim() === '') return '<div style="height:8px;"></div>'
        return `<p style="font-size:14px;margin:2px 0;color:#1E293B;">${l}</p>`
      }).join('\n')

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resumen MedConnect</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#1E293B;max-width:700px;margin:0 auto;}
h1{color:#0D9488;font-size:24px;margin:0 0 4px;border-bottom:3px solid #0D9488;padding-bottom:16px}
p.sub{color:#64748B;font-size:14px;margin:4px 0 20px;}
.d{background:#FFFBEB;border:1px solid #FDE68A;padding:12px;border-radius:6px;font-size:11px;color:#92400E;margin:16px 0;}
.f{margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;text-align:center;}
@media print{body{padding:20px;}}</style></head><body>
<h1>MedConnect</h1>
<p class="sub">Resumen de consulta medica</p>
${content}
<div class="d">Este resumen lo genera MedConnect de forma automatica. No reemplaza la historia clinica oficial. Consulta a tu medico para un diagnostico profesional.</div>
<div class="f"><p>Documento generado el ${date}</p></div>
<script>window.print()</script></body></html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (w) { w.document.title = 'Resumen MedConnect'; setTimeout(() => URL.revokeObjectURL(url), 60000) }
      else window.location.href = url
    } catch { }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Mi historial médico</h1>
          <p className="text-sm text-secondary">Tus consultas y documentos organizados en un solo lugar.</p>
        </div>
        <Link to="/schedule"><Button size="sm" className="sm:size-default">Agendar nueva cita</Button></Link>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 mb-5">
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

      <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 mb-5">
        <h2 className="text-base font-semibold mb-1 text-text">Consultas anteriores</h2>
        <p className="text-xs text-secondary mb-4">Revisa el resumen de tus consultas pasadas.</p>
        <div className="-mx-4 sm:-mx-0 overflow-x-auto">
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
                  <tr key={a.id} className="hover:bg-muted">
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

      <div className="bg-surface border border-border rounded-lg p-4 sm:p-6">
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
        <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Resumen de consulta</DialogTitle></DialogHeader>
          {summaryModal && (
            <div className="space-y-3">

              {summaryModal.status === 'completed' && summaryModal.summary ? (
                <div className="bg-white border border-border rounded-md overflow-hidden">
                  {(() => {
                    const lines = summaryModal.summary.split('\n').filter(Boolean)
                    if (lines.length === 0) return null
                    const header = lines[0]
                    const info = lines.slice(1).filter(l => l.includes(':') && !l.startsWith(' '))
                    const body = lines.slice(1).filter(l => !info.includes(l))
                    return (
                      <div>
                        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
                          <div className="font-bold text-sm text-primary">{header}</div>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {info.map((l, i) => {
                              const idx = l.indexOf(':')
                              if (idx < 0) return null
                              return (
                                <div key={i} className="flex flex-col gap-0.5">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">{l.slice(0, idx).trim()}</span>
                                  <span className="text-sm text-text font-medium">{l.slice(idx + 1).trim()}</span>
                                </div>
                              )
                            })}
                          </div>
                          {body.length > 0 && (
                            <div className="border-t border-border pt-3 space-y-2">
                              {body.map((l, i) => (
                                <p key={i} className="text-sm text-text leading-relaxed">{l}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : null}

              {summaryModal.status === 'completed' && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted mb-2">Notas del medico</h4>
                  <textarea value={summaryText} onChange={e => setSummaryText(e.target.value)} rows={3}
                    className="w-full p-3 border border-border rounded-md text-sm font-sans resize-y box-border focus:border-primary focus:outline-none"
                    placeholder="Agrega notas adicionales aqui..." />
                  <span className="text-xs text-muted mt-1 block">Los cambios se guardan automaticamente</span>
                </div>
              )}

              {summaryModal.status !== 'completed' && (
                <p className="text-sm text-secondary py-4 text-center">Cita cancelada. No hay resumen disponible.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2 w-full">
              {summaryModal?.status === 'completed' && summaryModal.summary && (
                <Button variant="outline" className="flex items-center gap-2" onClick={() => downloadPDF(summaryModal)}>
                  <Download size={14} /> Descargar PDF
                </Button>
              )}
              <Button variant="outline" onClick={() => setSummaryModal(null)} className="ml-auto">Cerrar</Button>
              {summaryModal?.status === 'completed' && <Button onClick={saveSummaryText}>Guardar</Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 cursor-pointer" onClick={() => setConfirm(null)}
          role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center shadow-lg cursor-default" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-error" />
            </div>
            <h3 id="confirm-title" className="text-lg font-bold mb-2 text-text">{confirm.title}</h3>
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
