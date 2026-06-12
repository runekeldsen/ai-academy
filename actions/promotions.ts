'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createPromotion(data: {
  teamId: string
  contentType: 'module' | 'resource'
  contentId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (data.contentType !== 'module' && data.contentType !== 'resource') {
    return { error: 'Invalid content type' }
  }

  // Team must belong to this trainer
  const { data: team } = await supabase
    .from('academy_teams')
    .select('id')
    .eq('id', data.teamId)
    .eq('trainer_id', user.id)
    .single()
  if (!team) return { error: 'Team not found' }

  // Content must belong to this trainer
  const table = data.contentType === 'module' ? 'academy_modules' : 'academy_resources'
  const { data: content } = await supabase
    .from(table)
    .select('id')
    .eq('id', data.contentId)
    .eq('trainer_id', user.id)
    .single()
  if (!content) return { error: 'Content not found' }

  const { error } = await getAdmin()
    .from('academy_promotions')
    .insert({
      trainer_id: user.id,
      team_id: data.teamId,
      content_type: data.contentType,
      content_id: data.contentId,
    })
  if (error) {
    if (error.code === '23505') return { error: 'That content is already promoted to this team' }
    return { error: error.message }
  }

  revalidatePath('/trainer/promotions')
  revalidatePath('/portal')
  return {}
}

export async function deletePromotion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await getAdmin()
    .from('academy_promotions')
    .delete()
    .eq('id', id)
    .eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/promotions')
  revalidatePath('/portal')
  return {}
}

export async function dismissPromotion(promotionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await getAdmin()
    .from('academy_promotion_dismissals')
    .upsert(
      { promotion_id: promotionId, learner_id: user.id },
      { onConflict: 'promotion_id,learner_id', ignoreDuplicates: true },
    )
  revalidatePath('/portal')
}
