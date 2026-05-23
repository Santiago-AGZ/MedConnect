import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeAppointment } from '../lib/api'
import { UserRound, Mic, MicOff, Camera, CameraOff, Lightbulb, PhoneOff, Bot, Circle, Send, Volume2 } from 'lucide-react'

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
  const voicesLoadedRef = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => { voicesLoadedRef.current = true }
    }
  }, [])
  const [doctor, setDoctor] = useState({ name: 'Dra. María Torres', specialty: 'Medicina General' })
  const navigate = useNavigate()
  const doctorData = JSON.parse(localStorage.getItem('mc_current_doctor') || '{}')
  const lastApp = JSON.parse(localStorage.getItem('mc_last_appointment') || 'null')
  useEffect(() => { if (doctorData.name) setDoctor(doctorData) }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = s
      if (localVideo.current) localVideo.current.srcObject = s; setCameraOn(true)
    } catch { alert('No se pudo acceder a la cámara. Permite el acceso en tu navegador.') }
  }
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
    const questions = suggestions[doctor.specialty] || [
      '¿Cuáles son tus principales síntomas y desde cuándo los tienes?',
      '¿Has tenido alguna condición médica previa relacionada?',
      '¿Hay algo que empeore o mejore tus síntomas?'
    ]
    setChatMessages(prev => [...prev, { role: 'assistant', text: `Preguntas sugeridas para ${doctor.name}:\n\n• ${questions.join('\n\n• ')}` }])
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setAiSuggestion('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      setShowAiChat(true)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setUserQuestion(transcript)
      setIsListening(false)
      setTimeout(() => { handleAsk(transcript) }, 100)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  const handleAsk = (text?: string) => {
    const q = (text || userQuestion).trim().toLowerCase()
    if (!q) return
    let answer = ''
    if (q.includes('fiebre') || q.includes('temperatura')) answer = 'Si tienes fiebre (más de 38°C), es importante que informes al médico desde cuándo y si ha bajado con medicamentos.'
    else if (q.includes('dolor')) answer = 'Describe al médico la ubicación del dolor, su intensidad (del 1 al 10) y si es constante o va y viene.'
    else if (q.includes('medicamento') || q.includes('pastilla') || q.includes('receta')) answer = 'Lleva una lista de todos los medicamentos que tomas actualmente, incluyendo dosis y horarios.'
    else if (q.includes('alergia') || q.includes('alérgico')) answer = 'Informa al médico sobre cualquier alergia que tengas, especialmente a medicamentos.'
    else if (q.includes('cirugía') || q.includes('operación')) answer = 'Menciona al médico si has tenido cirugías previas y cuándo fueron.'
    else if (q.includes('análisis') || q.includes('examen') || q.includes('resultado')) answer = 'Puedes subir tus resultados desde la sección de Documentos en el historial.'
    else if (q.includes('recomienda') || q.includes('consejo')) answer = `Tu médico ${doctor.name} te dará recomendaciones personalizadas durante la consulta.`
    else answer = `Consulta con ${doctor.name}: explica tus síntomas con claridad, desde cuándo los tienes y qué los mejora o empeora.`
    setChatMessages(prev => [...prev, { role: 'assistant', text: answer }])
    speak(answer)
  }

  const endCall = () => {
    stopCamera()
    if (lastApp?.id) completeAppointment(lastApp.id).then(() => navigate('/history'))
    else navigate('/history')
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
        <div className="bg-[#1a1a2e] min-h-[340px] flex items-center justify-center relative">
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
          <span className="text-xs text-secondary font-medium px-2 py-2.5">12:35</span>
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
                    <button onClick={() => speak(msg.text)} className="flex-shrink-0 p-1 rounded bg-transparent border-none cursor-pointer text-green-600 hover:bg-green-100 transition-colors" title="Escuchar">
                      <Volume2 size={14} />
                    </button>
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
