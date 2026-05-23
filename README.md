# MedConnect

Plataforma de teleconsulta medica accesible, diseñada para pacientes con diferentes niveles de alfabetización digital. Prioriza claridad del contenido, accesibilidad y microcopias para reducir errores.

## Objetivo

Aplicar UX Writing para flujos criticos: agendar cita, videollamada y carga de documentos. Crear microcopias inclusivas, mensajes claros y formularios accesibles.

## Flujo de la aplicacion

```
Inicio → Registro (validacion de contraseña en vivo)
      → Login (autenticacion con Supabase)
      → Agendar cita (seleccion de medico + fecha + motivo)
      → Videollamada (WebRTC + chat asistente IA + voz)
      → Historial medico (resumen clinico + descarga PDF)
```

## Funcionalidades

- **Autenticacion**: registro con auto-login, inicio de sesion, proteccion de rutas
- **Agendamiento**: catalogo de medicos con especialidades, seleccion de fecha y horario
- **Videollamada**: activacion de camara y microfono reales con WebRTC
- **Chat asistente**: integracion con Groq IA para responder dudas durante la consulta
- **Reconocimiento de voz**: entrada por microfono usando Web Speech API
- **Historial**: citas proximas, completadas y canceladas con resumen clinico
- **Documentos**: subida y descarga de archivos (recetas, resultados)
- **Resumen PDF**: descarga de resumen clinico con indicaciones
- **UX Writing**: microcopias inclusivas, tono empatico, validacion en vivo
- **Accesibilidad**: contraste WCAG AA, roles ARIA, navegacion por teclado
- **Diseno responsive**: adaptable a movil, tablet y escritorio

## Leyes de diseno aplicadas

Fitts, Hick, Proximidad, Jakob, Pragnanz, Miller, Tesler

## Tecnologias

Vite, React, TypeScript, shadcn/ui, Tailwind v4, Supabase (Auth + PostgreSQL + Storage), Groq API, WebRTC, Web Speech API, Lucide icons
