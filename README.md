# MedConnect

Plataforma de teleconsulta médica accesible. Prototipo funcional con React + Vite + shadcn/ui + Supabase + Groq IA.

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind v4
- **UI**: shadcn/ui + Lucide icons
- **Backend**: Supabase (Auth + PostgreSQL + Storage)
- **IA**: Groq API (llama-3.3-70b-versatile)
- **Voz**: Web Speech API
- **Video**: WebRTC

## Instalacion

```bash
cd medconnect-app
npm install
npm run dev
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
VITE_SUPABASE_URL=tu-url
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_GROQ_API_KEY=tu-groq-key
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

## Base de datos

Ejecutar `supabase/migration.sql` en el SQL Editor de Supabase.

## Flujo

```
Inicio → Registro/Login → Agendar cita
  → Videollamada (WebRTC + chat IA + voz)
    → Historial medico (resumen + PDF)
```

## Caracteristicas

- Autenticacion con Supabase
- Agendamiento de citas con medicos
- Videollamada con camara real (WebRTC)
- Chat asistente con Groq IA
- Reconocimiento de voz (Web Speech API)
- Historial medico con resumen clinico
- Descarga de resumen en PDF
- Subida y descarga de documentos
- Validacion de contraseña en vivo
- Diseño responsive
