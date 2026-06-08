'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSupportThread(
  subject: string,
  message: string,
  imageUrl?: string | null
): Promise<{ threadId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.trainer_id) return { error: 'No trainer assigned' }

  const { data: thread, error: threadError } = await supabase
    .from('academy_support_threads')
    .insert({ learner_id: user.id, trainer_id: profile.trainer_id, subject })
    .select('id')
    .single()

  if (threadError || !thread) return { error: threadError?.message ?? 'Failed to create thread' }

  const { error: msgError } = await supabase.from('academy_support_messages').insert({
    thread_id: thread.id,
    sender_id: user.id,
    role: 'learner',
    content: message,
    image_url: imageUrl ?? null,
  })

  if (msgError) return { error: msgError.message }

  revalidatePath('/portal/support')
  return { threadId: thread.id }
}

export async function sendThreadMessage(
  threadId: string,
  content: string,
  imageUrl?: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role === 'trainer' ? 'trainer' : 'learner'

  const { error } = await supabase.from('academy_support_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    role,
    content,
    image_url: imageUrl ?? null,
  })

  if (error) return { error: error.message }

  const now = new Date().toISOString()
  await supabase.from('academy_support_threads').update({ updated_at: now }).eq('id', threadId)
  if (role === 'learner') {
    await supabase.from('academy_profiles').update({ last_active_at: now }).eq('id', user.id)
  }

  revalidatePath(`/portal/support/${threadId}`)
  revalidatePath(`/trainer/support/${threadId}`)
  revalidatePath('/trainer/support')
  return {}
}

export async function resolveThread(threadId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_support_threads')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('trainer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/trainer/support/${threadId}`)
  revalidatePath('/trainer/support')
  return {}
}

export async function reopenThread(threadId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_support_threads')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('trainer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/trainer/support/${threadId}`)
  revalidatePath('/trainer/support')
  return {}
}
