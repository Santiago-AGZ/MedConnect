# MedConnect

Plataforma de teleconsulta médica accesible.

## Stack
- Frontend: Vite + React 18 + TypeScript + shadcn/ui + Tailwind v4
- Backend: Supabase (Auth, PostgreSQL, Storage)
- IA: Grok API (xAI)
- Iconos: Lucide React

## Estructura
- `src/pages/` — Home, Login, Register, Schedule, VideoCall, History
- `src/components/` — Navbar, shadcn/ui components
- `src/lib/api.ts` — Cliente Supabase + funciones CRUD
- `supabase/migration.sql` — Esquema de base de datos
- `supabase/functions/ai-assist/` — Edge Function para Grok

## Comandos
- `npm run dev` — Desarrollo
- `npm run build` — Producción
- `npx supabase functions deploy ai-assist` — Desplegar IA

## Flujo
Inicio → Registro/Login → Agendar cita → Videollamada → Historial
