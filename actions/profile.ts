'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(firstName: string, lastName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('academy_profiles')
    .update({ first_name: firstName.trim(), last_name: lastName.trim() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal', 'layout')
  revalidatePath('/trainer', 'layout')
  return {}
}

export async function updateAvatar(avatarUrl: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('academy_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal', 'layout')
  revalidatePath('/trainer', 'layout')
  return {}
}

export async function updateEmailNudges(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('academy_profiles')
    .update({ email_nudges: enabled })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal/profile')
  return {}
}

export async function markWelcomeSeen(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('academy_profiles').update({ welcomed_at: new Date().toISOString() }).eq('id', user.id)
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'Current password is incorrect' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return {}
}
