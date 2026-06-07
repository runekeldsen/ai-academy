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
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

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
  })
  if (profileErr) return { error: profileErr.message }

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
    .select('email')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .single()
  if (!learner?.email) return { error: 'Learner not found' }

  // Send password reset email — works for already-confirmed users
  const { error } = await supabase.auth.resetPasswordForEmail(learner.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  })
  if (error) return { error: error.message }

  return {}
}
