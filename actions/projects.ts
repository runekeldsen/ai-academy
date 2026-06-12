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
  await notifyLearnerOfFeedback(supabase, id)
  revalidatePath('/trainer/projects')
  return {}
}

// Fire-and-forget — n8n downtime must never break the trainer's save
async function notifyLearnerOfFeedback(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  try {
    const url = process.env.NUDGE_FEEDBACK_WEBHOOK_URL
    if (!url || !process.env.NUDGE_API_SECRET) return

    const { data: project } = await supabase
      .from('academy_projects')
      .select('title, learner_id')
      .eq('id', projectId)
      .single()
    if (!project) return

    const { data: learner } = await supabase
      .from('academy_profiles')
      .select('first_name, email, email_nudges')
      .eq('id', project.learner_id)
      .single()
    if (!learner?.email || learner.email_nudges === false) return

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.NUDGE_API_SECRET,
        email: learner.email,
        firstName: learner.first_name,
        projectTitle: project.title,
        projectId,
      }),
    })
  } catch {
    // never surface nudge failures to the trainer
  }
}
