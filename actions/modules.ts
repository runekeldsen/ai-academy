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
