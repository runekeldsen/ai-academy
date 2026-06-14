'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Email the trainer when a learner contacts them. Best-effort — never blocks the action.
async function notifyTrainer(opts: {
  trainerId: string
  learnerId: string
  threadId: string
  subject: string
  message: string
  isNewThread: boolean
}): Promise<void> {
  try {
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: trainer }, { data: learner }] = await Promise.all([
      admin.from('academy_profiles').select('email').eq('id', opts.trainerId).single(),
      admin.from('academy_profiles').select('first_name, last_name').eq('id', opts.learnerId).single(),
    ])
    if (!trainer?.email) return

    const learnerName = [learner?.first_name, learner?.last_name].filter(Boolean).join(' ') || 'A learner'
    const snippet = opts.message.length > 600 ? `${opts.message.slice(0, 600)}…` : opts.message
    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/trainer/support/${opts.threadId}`

    const { sendEmail, renderEmail } = await import('@/lib/email')
    const html = renderEmail({
      heading: "Rune's AI Academy",
      bodyHtml: `
        <p style="margin:0 0 16px;">${escapeHtml(learnerName)} ${opts.isNewThread ? 'opened a new support request' : 'replied to a support request'}.</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Subject</p>
        <p style="margin:0 0 16px;font-weight:600;">${escapeHtml(opts.subject)}</p>
        <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Message</p>
        <p style="margin:0;">${escapeHtml(snippet).replace(/\n/g, '<br>')}</p>`,
      cta: { label: 'View and reply', href: link },
    })
    await sendEmail({
      to: trainer.email,
      subject: `Support request from ${learnerName}: ${opts.subject}`,
      html,
    })
  } catch {
    // ignore — the support message is saved regardless of email delivery
  }
}

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

  await notifyTrainer({
    trainerId: profile.trainer_id,
    learnerId: user.id,
    threadId: thread.id,
    subject,
    message,
    isNewThread: true,
  })

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
  const threadUpdate: Record<string, string> = { updated_at: now }
  if (role === 'trainer') threadUpdate.last_trainer_message_at = now
  await supabase.from('academy_support_threads').update(threadUpdate).eq('id', threadId)
  if (role === 'learner') {
    await supabase.from('academy_profiles').update({ last_active_at: now }).eq('id', user.id)

    const { data: thread } = await supabase
      .from('academy_support_threads')
      .select('trainer_id, subject')
      .eq('id', threadId)
      .single()
    if (thread?.trainer_id) {
      await notifyTrainer({
        trainerId: thread.trainer_id,
        learnerId: user.id,
        threadId,
        subject: thread.subject ?? 'Support request',
        message: content,
        isNewThread: false,
      })
    }
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
