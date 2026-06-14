'use server'

import { createClient } from '@/lib/supabase/server'
import { renderEmail, sendBatch } from '@/lib/email'

export async function broadcastToTeam(
  teamId: string,
  subject: string,
  message: string
): Promise<{ error?: string; sent?: number; failed?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!subject.trim() || !message.trim()) return { error: 'Subject and message are required' }

  // Verify the team belongs to this trainer
  const { data: team } = await supabase
    .from('academy_teams')
    .select('id, name, academy_name')
    .eq('id', teamId)
    .eq('trainer_id', user.id)
    .single()
  if (!team) return { error: 'Team not found' }

  const { data: learners } = await supabase
    .from('academy_profiles')
    .select('email')
    .eq('trainer_id', user.id)
    .eq('team_id', teamId)
    .eq('role', 'learner')
    .not('email', 'is', null)

  const recipients = (learners ?? []).map(l => l.email).filter((e): e is string => !!e)
  if (recipients.length === 0) return { error: 'This team has no learners with an email address' }

  const brand = team.academy_name?.trim() || "Rune's AI Academy"
  const html = renderEmail({
    heading: brand,
    bodyHtml: message
      .split('\n')
      .map(line => `<p style="margin:0 0 12px;">${escapeHtml(line) || '&nbsp;'}</p>`)
      .join(''),
  })

  const { sent, failed } = await sendBatch(
    recipients.map(to => ({ to, subject, html }))
  )
  return { sent, failed }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
