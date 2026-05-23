import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeAppointment, saveChatMessage, saveSummary } from '../lib/api'
import { supabase } from '../lib/api'
import { UserRound, Mic, MicOff, Camera, CameraOff, Lightbulb, PhoneOff, Bot, Circle, Send } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function VideoCall() {
  const localVideo = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([])
  const [userQuestion, setUserQuestion] = useState('')
  const [showAiChat, setShowAiChat] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  useEffect(() => {
    setChatMessages([])
    setShowAiChat(false)
  }, [])
  
  useEffect(() => {
    startTimeRef.current = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const [doctor, setDoctor] = useState({ name: 'Dra. María Torres', specialty: 'Medicina General' })
  const navigate = useNavigate()
  const doctorData = JSON.parse(localStorage.getItem('mc_current_doctor') || '{}')
  const lastApp = JSON.parse(localStorage.getItem('mc_last_appointment') || 'null')

  const consultaContext = lastApp?.reason
    ? `El paciente agendó esta consulta por: "${lastApp.reason}". `
    : ''
  useEffect(() => { if (doctorData.name) setDoctor(doctorData) }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = s
      setCameraOn(true)
    } catch { alert('No se pudo acceder a la cámara. Permite el acceso en tu navegador.') }
  }

  useEffect(() => {
    if (cameraOn && streamRef.current && localVideo.current) {
      localVideo.current.srcObject = streamRef.current
    }
  }, [cameraOn])
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; if (localVideo.current) localVideo.current.srcObject = null; setCameraOn(false)
  }
  const toggleCamera = () => cameraOn ? stopCamera() : startCamera()
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => t.enabled = !t.enabled)
    setMicOn(!micOn)
  }

  const suggestions: Record<string, string[]> = {
    'Medicina General': [
      '¿Desde cuándo tienes los síntomas y cómo han evolucionado?',
      '¿Has tenido fiebre, pérdida de apetito o cambios de peso recientemente?',
      '¿Estás tomando algún medicamento actualmente?'
    ],
    'Pediatría': [
      '¿Tu hijo ha tenido fiebre en los últimos días? ¿Cuánto le duró?',
      '¿Ha comido y dormido con normalidad?',
      '¿Tiene las vacunas al día?'
    ],
    'Cardiología': [
      '¿Has sentido dolor en el pecho, falta de aire o palpitaciones?',
      '¿Tienes antecedentes familiares de enfermedades del corazón?',
      '¿Fumas, tomas alcohol o haces ejercicio regularmente?'
    ],
    'Dermatología': [
      '¿Desde cuándo tienes esa molestia en la piel? ¿ ha cambiado de tamaño o color?',
      '¿Te has expuesto al sol sin protección recientemente?',
      '¿Usas algún producto nuevo en tu rutina de cuidado personal?'
    ],
  }

  const askAI = () => {
    setShowAiChat(true)
    const prevMessages = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user' as const,
      content: m.text
    }))
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      const questions = suggestions[doctor.specialty] || [
        '¿Cuáles son tus principales síntomas y desde cuándo los tienes?',
        '¿Has tenido alguna condición médica previa relacionada?',
        '¿Hay algo que empeore o mejore tus síntomas?'
      ]
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Preguntas sugeridas para ${doctor.name}:\n\n• ${questions.join('\n\n• ')}` }])
      return
    }
    const chatId = Date.now().toString()
    setChatMessages(prev => [...prev, { role: 'assistant', text: 'Pensando...' }])
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `Eres un asistente médico de MedConnect. Ayudas al paciente a preparar preguntas para su médico. Solo respondes sobre salud/medicina. ${consultaContext}Sé breve, claro, en español. No diagnosticas ni recetas.` },
          ...prevMessages.slice(-6).map(m => ({ role: m.role, content: m.text })),
        ],
      }),
    })
      .then(res => res.json())
      .then(data => {
        const text = data.choices?.[0]?.message?.content || 'No entendí. Intenta de nuevo.'
        setChatMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text }
          return next
        })
      })
      .catch(() => {
        setChatMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text: `Preguntas sugeridas para ${doctor.name}:\n\n• ${questions.join('\n\n• ')}` }
          return next
        })
      })
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.' }])
      setShowAiChat(true)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      handleAsk(transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const handleAsk = (text?: string) => {
    const raw = (text || userQuestion).trim()
    if (!raw) return
    setChatMessages(prev => [...prev, { role: 'user', text: raw }, { role: 'assistant', text: 'Pensando...' }])
    setUserQuestion('')
    if (lastApp?.id) saveChatMessage(lastApp.id, raw, 'T')
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `Eres un asistente medico virtual de MedConnect. Ayudas al paciente durante su consulta. Responde de forma CONCISA (max 3 oraciones). Si te preguntan algo NO relacionado con salud o medicina, responde: "Lo siento, solo puedo ayudarte con temas de salud." ${consultaContext}IMPORTANTE: No diagnosticas ni recetas medicamentos. Siempre sugiere consultar al medico tratante.` },
          { role: 'user', content: `${consultaContext}Pregunta del paciente: ${raw}` },
        ],
      }),
    })
      .then(res => res.json())
      .then(data => {
        const text = data.choices?.[0]?.message?.content || 'No entendí. Intenta de nuevo.'
        setChatMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text }
          return next
        })
        if (lastApp?.id) saveChatMessage(lastApp.id, text, 'Asistente')
      })
      .catch(() => {
        setChatMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text: 'Lo siento, no pude conectar con el servicio. Intenta de nuevo.' }
          return next
        })
      })
  }

  const endCall = () => {
    stopCamera()
    if (lastApp?.id) {
      const dateStr = new Date().toLocaleDateString('es-CO')
      const timeStr = elapsed >= 3600
        ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
        : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
      const motivo = lastApp?.reason || 'No especificado'
      const descripcion = chatMessages.find(m => m.role === 'user')?.text || ''
      const recomendacion = [...chatMessages].reverse().find(m => m.role === 'assistant' && m.text !== 'Pensando...')?.text || ''
      const summary = `Fecha: ${dateStr} | Duracion: ${timeStr} | Medico: ${doctor.name} (${doctor.specialty}) | Motivo de consulta: ${motivo} | Sintomas reportados: ${descripcion} | Indicaciones: ${recomendacion}`
      completeAppointment(lastApp.id)
      saveSummary(lastApp.id, summary)
      navigate('/history')
    } else navigate('/history')
  }

  const generatePDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user?.id).single()
      const patientName = profile?.name || user?.email?.split('@')[0] || 'Paciente'
      const now = new Date()
      const dateStr = now.toLocaleDateString('es-CO')
      const timeStr = elapsed >= 3600
        ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
        : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`

      const msgs = chatMessages.filter(m => m.text !== 'Pensando...')

      const el = document.createElement('div')
      el.innerHTML = `
<div style="font-family:Arial,sans-serif;padding:40px;color:#1E293B;max-width:700px;margin:0 auto;">
<div style="border-bottom:3px solid #0D9488;padding-bottom:16px;margin-bottom:24px;">
  <h1 style="color:#0D9488;font-size:24px;margin:0;">MedConnect</h1>
  <p style="color:#64748B;font-size:15px;margin:4px 0 0;">Resumen de consulta medica</p>
</div>
<div style="margin-bottom:20px;">
  <h3 style="font-size:13px;text-transform:uppercase;color:#94A3B8;letter-spacing:1px;margin:0 0 8px;">Informacion del paciente</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Nombre</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${patientName}</td></tr>
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Fecha</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${dateStr}</td></tr>
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Duracion</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${timeStr}</td></tr>
  </table>
</div>
<div style="margin-bottom:20px;">
  <h3 style="font-size:13px;text-transform:uppercase;color:#94A3B8;letter-spacing:1px;margin:0 0 8px;">Informacion medica</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Medico</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${doctor.name}</td></tr>
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Especialidad</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${doctor.specialty}</td></tr>
    <tr><td style="color:#64748B;width:130px;padding:6px 0;border-bottom:1px solid #E2E8F0;font-weight:500;">Motivo</td><td style="padding:6px 0;border-bottom:1px solid #E2E8F0;">${lastApp?.reason || 'No especificado'}</td></tr>
  </table>
</div>
${msgs.length > 0 ? `<div style="margin-bottom:20px;">
  <h3 style="font-size:13px;text-transform:uppercase;color:#94A3B8;letter-spacing:1px;margin:0 0 8px;">Resumen de la consulta</h3>
  ${msgs.map(m => `<div style="padding:8px 12px;margin:4px 0;border-radius:6px;font-size:13px;${m.role === 'assistant' ? 'background:#F0FDFA;border-left:3px solid #0D9488;' : 'background:#F1F5F9;border-left:3px solid #64748B;'}"><strong>${m.role === 'assistant' ? 'Asistente' : 'Paciente'}:</strong> ${m.text}</div>`).join('')}
</div>` : ''}
<div style="background:#FFFBEB;border:1px solid #FDE68A;padding:12px;border-radius:6px;font-size:11px;color:#92400E;margin:16px 0;">
  Este resumen lo genera MedConnect de forma automatica. No reemplaza la historia clinica oficial ni lo que diga tu medico. Consulta con el para un diagnostico profesional.
</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;text-align:center;">
  <p style="margin:2px 0;">MedConnect - Plataforma de Teleconsulta Medica Accesible</p>
  <p style="margin:2px 0;">Documento generado el ${dateStr}</p>
</div></div>`

      document.body.appendChild(el)
      html2pdf().set({ margin: 10, filename: `Resumen_MedConnect_${now.getTime()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(el).save().then(() => el.remove())
    } catch (e) { /* silencioso */ }
  }

  const CtrlBtn = ({ onClick, active, icon: Icon, label }: { onClick: () => void; active?: boolean; icon: any; label: string }) => (
    <button onClick={onClick} className={`px-4 py-2.5 rounded-md text-sm font-medium border-none cursor-pointer flex items-center gap-2 transition-all active:scale-[0.95] ${active !== undefined ? (active ? 'bg-primary text-white shadow-sm' : 'bg-bg text-text hover:bg-border') : 'bg-bg text-text hover:bg-border'}`}>
      <Icon size={16} /> {label}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold mb-1 text-text">Sala de consulta</h1>
      <p className="text-sm text-secondary mb-6">Tu videollamada está lista. Conéctate cuando sea tu horario.</p>

      <div className="flex justify-center gap-2 mb-6">
        <span className="step completed"><span className="text-white text-xs">&#10003;</span></span>
        <span className="step completed"><span className="text-white text-xs">&#10003;</span></span>
        <span className="step active">3</span>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="bg-[#1a1a2e] min-h-[280px] sm:min-h-[340px] flex items-center justify-center relative">
          {cameraOn ? (
            <video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover max-h-[400px]" />
          ) : (
            <div className="text-center text-white px-6">
              <div className="flex items-center gap-2 absolute top-4 left-4">
                <Circle size={8} className="fill-green-500 text-green-500 animate-pulse" />
                <span className="text-xs text-white/60">Sala activa</span>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
                <UserRound size={40} className="text-white/60" />
              </div>
              <h3 className="text-xl font-semibold mb-1">{doctor.name}</h3>
              <p className="text-sm text-white/60 mb-4">{doctor.specialty}</p>
              <button onClick={startCamera}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-md border-none cursor-pointer hover:bg-primary-hover transition-all active:scale-[0.95] inline-flex items-center gap-2">
                <Camera size={16} /> Activar cámara
              </button>
              <p className="text-xs text-white/40 mt-3">Presiona el botón para iniciar la videollamada</p>
            </div>
          )}
          <div className="absolute bottom-4 right-3 w-28 h-20 bg-[#2d2d44] rounded border border-white/10 flex items-center justify-center text-xs text-white/40">
            <CameraOff size={12} className="mr-1.5" /> Tu video
          </div>
        </div>

        <div className="flex gap-2 p-3 bg-white border-t border-border flex-wrap justify-center">
          <CtrlBtn onClick={toggleCamera} active={cameraOn} icon={cameraOn ? Camera : CameraOff} label={cameraOn ? 'Cámara activa' : 'Activar cámara'} />
          <CtrlBtn onClick={toggleMic} active={micOn} icon={micOn ? Mic : MicOff} label={micOn ? 'Micrófono activo' : 'Micrófono mute'} />
          <CtrlBtn onClick={askAI} icon={Bot} label="Preguntar a IA" />
          <span className="text-xs text-secondary font-medium px-2 py-2.5">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span>
          <button onClick={endCall} className="px-4 py-2.5 rounded-md text-sm font-medium bg-error text-white border-none cursor-pointer flex items-center gap-2 hover:bg-red-600 transition-all active:scale-[0.95]">
            <PhoneOff size={16} /> Finalizar consulta
          </button>
        </div>

        {showAiChat && (
          <div className="mx-3 mb-3 border border-border rounded-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 text-sm flex gap-2 ${msg.role === 'user' ? 'bg-white border-b border-border' : 'bg-green-50 border-b border-green-200'}`}>
                  {msg.role === 'user' ? (
                    <UserRound size={16} className="flex-shrink-0 mt-0.5 text-secondary" />
                  ) : (
                    <Bot size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                  )}
                  <div className="flex-1" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  {msg.role === 'assistant' && (
                    <Bot size={14} className="flex-shrink-0 mt-0.5 text-green-600" />
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2.5 bg-white flex gap-2 border-t border-border">
              <input type="text" value={userQuestion} onChange={e => setUserQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                placeholder="Escribe o usa el micrófono..."
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary" />
              <button onClick={toggleListening}
                className={`px-3 py-2 rounded-md border-none cursor-pointer transition-all active:scale-[0.95] flex items-center gap-1.5 text-sm ${isListening ? 'bg-error text-white' : 'bg-bg text-text hover:bg-border'}`}
                title={isListening ? 'Grabando...' : 'Hablar'}>
                <Mic size={14} />
              </button>
              <button onClick={() => handleAsk()}
                className="px-3 py-2 bg-primary text-white rounded-md border-none cursor-pointer hover:bg-primary-hover transition-all active:scale-[0.95] flex items-center gap-1.5 text-sm">
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="mx-3 mb-3 p-3.5 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex gap-2.5">
          <Lightbulb size={18} className="flex-shrink-0 mt-0.5 text-blue-600" />
          <div>
            <strong>¿Cómo funciona?</strong>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              <li><strong>Cámara:</strong> Actívala para que el médico te vea</li>
              <li><strong>Mic:</strong> Controla si el médico te escucha</li>
              <li><strong>Preguntar a IA:</strong> Sugiere preguntas para hacerle al médico</li>
              <li><strong>Finalizar consulta:</strong> Termina la llamada y guarda el historial</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
