'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function trackModuleOpened(moduleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await Promise.all([
    supabase.from('academy_progress').upsert(
      { learner_id: user.id, module_id: moduleId },
      { onConflict: 'learner_id,module_id', ignoreDuplicates: true }
    ),
    supabase.from('academy_profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id),
  ])
}

export async function setStepChecked(moduleId: string, stepIndex: number, checked: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('academy_progress').upsert(
    { learner_id: user.id, module_id: moduleId },
    { onConflict: 'learner_id,module_id', ignoreDuplicates: true }
  )

  const { data: row } = await supabase.from('academy_progress')
    .select('completed_steps')
    .eq('learner_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const current = new Set<number>(row?.completed_steps ?? [])
  if (checked) current.add(stepIndex)
  else current.delete(stepIndex)

  const { error } = await supabase.from('academy_progress')
    .update({ completed_steps: [...current].sort((a, b) => a - b) })
    .eq('learner_id', user.id)
    .eq('module_id', moduleId)

  if (error) return { error: error.message }
  return {}
}

export async function setModuleCompleted(moduleId: string, completed: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('academy_progress').upsert(
    { learner_id: user.id, module_id: moduleId },
    { onConflict: 'learner_id,module_id', ignoreDuplicates: true }
  )

  const { error } = await supabase.from('academy_progress')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('learner_id', user.id)
    .eq('module_id', moduleId)

  if (error) return { error: error.message }

  revalidatePath(`/portal/modules/${moduleId}`)
  revalidatePath('/portal')
  return {}
}
