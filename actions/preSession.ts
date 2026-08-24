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
