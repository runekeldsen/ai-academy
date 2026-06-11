'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(title: string, description = ''): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('academy_projects')
    .insert({ title, description, learner_id: user.id, trainer_id: profile?.trainer_id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/portal/projects')
  return { id: data.id }
}

export async function saveProject(id: string, data: {
  title: string
  description: string
  complexityScore: number
  complexityLabel: string
  aiGuide: string
  aiWarnings: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_projects')
    .update({
      title: data.title,
      description: data.description,
      complexity_score: data.complexityScore,
      complexity_label: data.complexityLabel,
      ai_guide: data.aiGuide,
      ai_warnings: data.aiWarnings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('learner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal/projects')
  return {}
}

export async function requestTrainerInput(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_projects')
    .update({ trainer_requested: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('learner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal/projects')
  revalidatePath('/trainer/projects')
  return {}
}

export async function setProjectShipped(id: string, shipped: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_projects')
    .update({ shipped_at: shipped ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('learner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal/projects')
  revalidatePath('/portal')
  return {}
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_projects')
    .delete()
    .eq('id', id)
    .eq('learner_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/portal/projects')
  return {}
}

export async function saveTrainerFeedback(id: string, feedback: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_projects')
    .update({
      trainer_feedback: feedback,
      trainer_responded_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/trainer/projects')
  return {}
}
