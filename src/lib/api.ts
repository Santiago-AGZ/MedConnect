import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getDoctors() {
  const { data } = await supabase.from('doctors').select('*')
  return data || []
}

export async function createAppointment({ doctorId, date, time, reason }: { doctorId: number; date: string; time: string; reason: string }) {
  const user = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase.from('appointments').insert({
    user_id: user!.id, doctor_id: doctorId, date, time, reason
  }).select().single()
  if (error) throw error
  return data
}

export async function getAppointments() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return []
  const { data } = await supabase
    .from('appointments')
    .select('*, doctors(name, specialty)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return data || []
}

export async function cancelAppointment(id: string) {
  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
}

export async function completeAppointment(id: string) {
  await supabase.from('appointments').update({ status: 'completed', summary: 'Consulta completada.' }).eq('id', id)
}

export async function saveSummary(id: string, summary: string) {
  await supabase.from('appointments').update({ summary }).eq('id', id)
}

export async function getDocuments() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return []
  const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return data || []
}

export async function uploadDocument(file: File, appointmentId: string | null) {
  const user = (await supabase.auth.getUser()).data.user
  const ext = file.name.split('.').pop()
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user!.id}/${Date.now()}_${cleanName}`
  const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
  if (upErr) throw upErr
  const { error } = await supabase.from('documents').insert({ user_id: user!.id, name: file.name, size: file.size, type: file.type, storage_path: path, appointment_id: appointmentId })
  if (error) throw error
}

export async function deleteDocument(id: string, storagePath: string) {
  await supabase.storage.from('documents').remove([storagePath])
  await supabase.from('documents').delete().eq('id', id)
}

export async function saveChatMessage(appointmentId: string, message: string, senderName = 'Paciente') {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user || !appointmentId) return
    const { error } = await supabase.from('chat_messages').insert({
      appointment_id: appointmentId, sender_id: user.id, sender_name: senderName, message
    })
    if (error) console.warn('Error guardando mensaje:', error.message)
  } catch (e) {
    // Fail silently
  }
}

export async function getChatMessages(appointmentId: string) {
  try {
    if (!appointmentId) return []
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true })
    return data || []
  } catch { return [] }
}
