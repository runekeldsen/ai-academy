'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSection(title: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_sections').insert({ title, trainer_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function updateSection(id: string, title: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_sections').update({ title }).eq('id', id).eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function deleteSection(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_sections').delete().eq('id', id).eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function createModule(data: {
  sectionId: string
  title: string
  description: string
  content: string
  difficulty: string
  durationMinutes: number | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_modules').insert({
    section_id: data.sectionId,
    trainer_id: user.id,
    title: data.title,
    description: data.description,
    content: data.content,
    difficulty: data.difficulty || null,
    duration_minutes: data.durationMinutes,
    published: false,
  })
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function updateModule(id: string, data: {
  title: string
  description: string
  content: string
  difficulty: string
  durationMinutes: number | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_modules')
    .update({
      title: data.title,
      description: data.description,
      content: data.content,
      difficulty: data.difficulty || null,
      duration_minutes: data.durationMinutes,
    })
    .eq('id', id)
    .eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function deleteModule(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_modules').delete().eq('id', id).eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  return {}
}

export async function toggleModulePublished(id: string, published: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_modules')
    .update({ published })
    .eq('id', id)
    .eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/content')
  revalidatePath('/portal')
  return {}
}

export async function updateModuleOrder(updates: { id: string; sort_order: number }[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  for (const { id, sort_order } of updates) {
    await supabase.from('academy_modules').update({ sort_order }).eq('id', id).eq('trainer_id', user.id)
  }
  revalidatePath('/trainer/content')
  revalidatePath('/portal')
  return {}
}

export async function updateSectionOrder(updates: { id: string; sort_order: number }[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  for (const { id, sort_order } of updates) {
    await supabase.from('academy_sections').update({ sort_order }).eq('id', id).eq('trainer_id', user.id)
  }
  revalidatePath('/trainer/content')
  revalidatePath('/portal')
  return {}
}

export async function setModuleExclusions(moduleId: string, excludedLearnerIds: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('academy_module_exclusions').delete().eq('module_id', moduleId)

  if (excludedLearnerIds.length > 0) {
    const rows = excludedLearnerIds.map(learner_id => ({ module_id: moduleId, learner_id, trainer_id: user.id }))
    const { error } = await supabase.from('academy_module_exclusions').insert(rows)
    if (error) return { error: error.message }
  }

  revalidatePath('/trainer/content')
  revalidatePath('/portal')
  return {}
}
