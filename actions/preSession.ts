'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TOPICS = ['financial-review', 'strategy-review', 'effective-meetings'] as const
export type Topic = (typeof TOPICS)[number]

export async function chooseTopic(topic: Topic): Promise<{ error?: string }> {
  if (!TOPICS.includes(topic)) return { error: 'Invalid topic' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_topic_choices')
    .upsert(
      { learner_id: user.id, topic, chosen_at: new Date().toISOString() },
      { onConflict: 'learner_id' }
    )
  if (error) return { error: error.message }

  revalidatePath('/portal/pre-session')
  revalidatePath('/trainer/teams')
  return {}
}

export async function dismissPreSession(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_profiles')
    .update({ pre_session_dismissed: true })
    .eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/portal')
  revalidatePath('/portal/pre-session')
  return {}
}

export async function redoPreSession(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('academy_teams(pre_session_section_id)')
    .eq('id', user.id)
    .single()

  const teamRaw = profile?.academy_teams
  const team = (Array.isArray(teamRaw) ? teamRaw[0] : teamRaw) as
    { pre_session_section_id: string | null } | null ?? null
  if (!team?.pre_session_section_id) return { error: 'No pre-session path for your team' }

  const { data: mods } = await supabase
    .from('academy_modules')
    .select('id')
    .eq('section_id', team.pre_session_section_id)

  const moduleIds = (mods ?? []).map(m => m.id)

  if (moduleIds.length > 0) {
    const { error: progressError } = await supabase
      .from('academy_progress')
      .update({ completed_at: null, completed_steps: [] })
      .eq('learner_id', user.id)
      .in('module_id', moduleIds)
    if (progressError) return { error: progressError.message }
  }

  const { error: topicError } = await supabase
    .from('academy_topic_choices')
    .delete()
    .eq('learner_id', user.id)
  if (topicError) return { error: topicError.message }

  revalidatePath('/portal/pre-session')
  return {}
}
