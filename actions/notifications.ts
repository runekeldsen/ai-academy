'use server'

import { createClient } from '@/lib/supabase/server'

export async function markRead(section: 'projects' | 'support' | 'portal') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('academy_profiles')
    .update({ [`${section}_read_at`]: new Date().toISOString() })
    .eq('id', user.id)
}
