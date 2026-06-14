'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteLearner(userId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

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

export async function createLearner(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  teamId?: string | null
  sendWelcome?: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Validate the team belongs to this trainer before assigning
  let teamId: string | null = null
  let academyName: string | null = null
  if (data.teamId) {
    const { data: team } = await supabase
      .from('academy_teams')
      .select('id, academy_name')
      .eq('id', data.teamId)
      .eq('trainer_id', user.id)
      .single()
    if (!team) return { error: 'Team not found' }
    teamId = team.id
    academyName = team.academy_name?.trim() || null
  }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { first_name: data.firstName, last_name: data.lastName, academy_role: 'learner' },
  })
  if (createErr) return { error: createErr.message }

  const { error: profileErr } = await admin.from('academy_profiles').upsert({
    id: created.user.id,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    role: 'learner',
    trainer_id: user.id,
    team_id: teamId,
  })
  if (profileErr) return { error: profileErr.message }

  // Welcome email with login details (best-effort — never blocks creation)
  if (data.sendWelcome !== false) {
    try {
      const { sendEmail, renderEmail } = await import('@/lib/email')
      const brand = academyName || "Rune's AI Academy"
      const loginUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
      const html = renderEmail({
        heading: brand,
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${data.firstName},</p>
          <p style="margin:0 0 16px;">You've been given access to <strong>${brand}</strong>. Use the details below to log in:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;width:100%;">
            <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;">
              <div style="margin-bottom:6px;"><strong>Email:</strong> ${data.email}</div>
              <div><strong>Password:</strong> ${data.password}</div>
            </td></tr>
          </table>
          <p style="margin:16px 0 0;color:#64748b;font-size:13px;">You can change your password once you're logged in.</p>`,
        cta: loginUrl ? { label: 'Log in', href: loginUrl } : undefined,
      })
      await sendEmail({ to: data.email, subject: `Your login for ${brand}`, html })
    } catch {
      // ignore — learner is created regardless of email delivery
    }
  }

  revalidatePath('/trainer/learners')
  revalidatePath('/trainer')
  if (teamId) {
    revalidatePath('/trainer/teams')
    revalidatePath(`/trainer/teams/${teamId}`)
  }
  return {}
}

export async function resendInvite(userId: string, origin: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('email')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .single()
  if (!learner?.email) return { error: 'Learner not found' }

  // Send password reset email — works for already-confirmed users.
  // Use the implicit recovery client so the link isn't PKCE-bound to a browser
  // (see lib/supabase/recovery-client.ts).
  const { createRecoveryClient } = await import('@/lib/supabase/recovery-client')
  const { error } = await createRecoveryClient().auth.resetPasswordForEmail(learner.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  })
  if (error) return { error: error.message }

  return {}
}

export async function setLearnerPassword(userId: string, password: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (typeof password !== 'string' || password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  // Verify the learner belongs to this trainer
  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('id')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .eq('role', 'learner')
    .single()
  if (!learner) return { error: 'Learner not found' }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) return { error: error.message }

  return {}
}
