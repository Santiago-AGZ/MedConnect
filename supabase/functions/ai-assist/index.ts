import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { prompt, context } = await req.json()

    const grokResponse = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GROK_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'grok-4.20-reasoning',
        input: [
          {
            role: 'system',
            content: 'Eres un asistente médico virtual de MedConnect. Ayudas a pacientes a preparar preguntas para su médico. Sé amable, claro y preciso. No diagnosticas ni recetas medicamentos.'
          },
          {
            role: 'user',
            content: `Contexto de la consulta: ${context}. Pregunta del paciente: ${prompt}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    const data = await grokResponse.json()

    let response = ''
    if (data.output && data.output.length > 0) {
      response = data.output.map((o: any) => o.content?.[0]?.text || '').filter(Boolean).join(' ')
    } else if (data.error) {
      response = `Error: ${data.error.message || JSON.stringify(data.error)}`
    } else {
      response = 'Lo siento, no pude procesar tu consulta.'
    }

    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
