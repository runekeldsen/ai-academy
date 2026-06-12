'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TemplateInput = {
  title: string
  description: string
  complexityScore: number
  complexityLabel: string
  category: string | null
  recommendedFirst: boolean
  sortOrder: number
  moduleId: string | null
}

function toRow(data: TemplateInput) {
  return {
    title: data.title,
    description: data.description,
    complexity_score: data.complexityScore,
    complexity_label: data.complexityLabel,
    category: data.category,
    recommended_first: data.recommendedFirst,
    sort_order: data.sortOrder,
    module_id: data.moduleId,
  }
}

function revalidate() {
  revalidatePath('/trainer/projects')
  revalidatePath('/portal/projects')
}

export async function createTemplate(data: TemplateInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!data.title.trim()) return { error: 'Title is required' }

  const { data: row, error } = await supabase
    .from('academy_project_templates')
    .insert({ ...toRow(data), trainer_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidate()
  return { id: row.id }
}

export async function updateTemplate(id: string, data: TemplateInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!data.title.trim()) return { error: 'Title is required' }

  const { error } = await supabase
    .from('academy_project_templates')
    .update(toRow(data))
    .eq('id', id)
    .eq('trainer_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return {}
}

export async function deleteTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_project_templates')
    .delete()
    .eq('id', id)
    .eq('trainer_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return {}
}
