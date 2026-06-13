'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTeam(data: {
  name: string
  welcomeMessage: string
  academyName?: string
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: team, error } = await supabase
    .from('academy_teams')
    .insert({
      name: data.name.trim(),
      welcome_message: data.welcomeMessage.trim(),
      academy_name: data.academyName?.trim() || null,
      trainer_id: user.id,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/trainer/teams')
  return { id: team.id }
}

export async function updateTeam(id: string, data: {
  name: string
  welcomeMessage: string
  academyName?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_teams')
    .update({
      name: data.name.trim(),
      welcome_message: data.welcomeMessage.trim(),
      academy_name: data.academyName?.trim() || null,
    })
    .eq('id', id)
    .eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/teams')
  revalidatePath(`/trainer/teams/${id}`)
  revalidatePath('/portal')
  return {}
}

export async function deleteTeam(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_teams')
    .delete()
    .eq('id', id)
    .eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/teams')
  revalidatePath('/trainer/learners')
  revalidatePath('/portal')
  return {}
}

export async function assignLearnerToTeam(learnerId: string, teamId: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify the learner belongs to this trainer
  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('id')
    .eq('id', learnerId)
    .eq('trainer_id', user.id)
    .single()
  if (!learner) return { error: 'Learner not found' }

  // Use admin client — RLS only allows users to update their own profile row
  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error } = await admin
    .from('academy_profiles')
    .update({ team_id: teamId })
    .eq('id', learnerId)
  if (error) return { error: error.message }

  revalidatePath('/trainer/learners')
  revalidatePath('/trainer/teams')
  if (teamId) revalidatePath(`/trainer/teams/${teamId}`)
  revalidatePath('/portal')
  return {}
}

export async function updateTeamSections(teamId: string, sectionIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify team ownership
  const { data: team } = await supabase
    .from('academy_teams')
    .select('id')
    .eq('id', teamId)
    .eq('trainer_id', user.id)
    .single()
  if (!team) return { error: 'Team not found' }

  // Replace all section assignments
  await supabase.from('academy_team_sections').delete().eq('team_id', teamId)

  if (sectionIds.length > 0) {
    const { error } = await supabase.from('academy_team_sections').insert(
      sectionIds.map(section_id => ({ team_id: teamId, section_id }))
    )
    if (error) return { error: error.message }
  }

  revalidatePath(`/trainer/teams/${teamId}`)
  revalidatePath('/portal')
  return {}
}
