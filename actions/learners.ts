'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteLearner(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify the learner belongs to this trainer
  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('id')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .single()
  if (!learner) return { error: 'Learner not found' }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.from('academy_profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)

  revalidatePath('/trainer/learners')
  revalidatePath('/trainer')
  return {}
}

export async function inviteLearner(data: {
  firstName: string
  lastName: string
  email: string
  origin: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: generated, error: genErr } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: data.email,
    options: {
      data: { first_name: data.firstName, last_name: data.lastName, academy_role: 'learner' },
    },
  })
  if (genErr) return { error: genErr.message }

  const { error: profileErr } = await admin.from('academy_profiles').upsert({
    id: generated.user.id,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    role: 'learner',
    trainer_id: user.id,
  })
  if (profileErr) return { error: profileErr.message }

  const origin = process.env.NEXT_PUBLIC_SITE_URL!
  const link = `${origin}/auth/callback?token_hash=${generated.properties.hashed_token}&type=invite&next=/auth/accept-invite`

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const { error: emailErr } = await resend.emails.send({
    from: 'AI Academy <onboarding@resend.dev>',
    to: data.email,
    subject: `${data.firstName}, you've been invited to AI Academy`,
    html: `
      <p>Hi ${data.firstName},</p>
      <p>You've been invited to AI Academy. Click the link below to set up your account:</p>
      <p><a href="${link}" style="color:#2563eb">Accept invitation →</a></p>
      <p style="color:#9ca3af;font-size:12px">This link expires in 24 hours.</p>
    `,
  })
  if (emailErr) return { error: String(emailErr) }

  revalidatePath('/trainer/learners')
  revalidatePath('/trainer')
  return {}
}

export async function resendInvite(userId: string, origin: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('email, first_name')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .single()
  if (!learner?.email) return { error: 'Learner not found' }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: generated, error: genErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: learner.email,
  })
  if (genErr) return { error: genErr.message }

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL!
  const link = `${siteOrigin}/auth/callback?token_hash=${generated.properties.hashed_token}&type=recovery&next=/auth/reset-password`

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const { error: emailErr } = await resend.emails.send({
    from: 'AI Academy <onboarding@resend.dev>',
    to: learner.email,
    subject: 'Set up your AI Academy account',
    html: `
      <p>Hi ${learner.first_name},</p>
      <p>Click the link below to set up your AI Academy password:</p>
      <p><a href="${link}" style="color:#2563eb">Set up account →</a></p>
      <p style="color:#9ca3af;font-size:12px">This link expires in 1 hour.</p>
    `,
  })
  if (emailErr) return { error: String(emailErr) }

  return {}
}
