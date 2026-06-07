'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Invite via Supabase auth — triggers invite email
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(data.email, {
    data: { first_name: data.firstName, last_name: data.lastName },
    redirectTo: `${data.origin}/auth/verify-invite?type=invite&next=/auth/accept-invite`,
  })
  if (inviteErr) return { error: inviteErr.message }

  // Create academy profile linked to this trainer
  const { error: profileErr } = await admin
    .from('academy_profiles')
    .upsert({
      id: invited.user.id,
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

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('email')
    .eq('id', userId)
    .eq('trainer_id', user.id)
    .single()

  if (!profile) return { error: 'Learner not found' }

  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.inviteUserByEmail(profile.email, {
    redirectTo: `${origin}/auth/verify-invite?type=invite&next=/auth/accept-invite`,
  })

  if (error) return { error: error.message }
  return {}
}
