import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { renderModuleContent } from '@/lib/renderModule'
import { PreSessionStepper } from '@/components/portal/pre-session-stepper'
import type { Topic } from '@/actions/preSession'

export default async function PreSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id, academy_teams(name, pre_session_section_id)')
    .eq('id', user!.id)
    .single()

  const teamRaw = profile?.academy_teams
  const team = (Array.isArray(teamRaw) ? teamRaw[0] : teamRaw) as
    { name: string; pre_session_section_id: string | null } | null ?? null

  if (!team?.pre_session_section_id) redirect('/portal')

  const { data: mods } = await supabase
    .from('academy_modules')
    .select('id, title, description, content, sort_order')
    .eq('section_id', team.pre_session_section_id)
    .eq('trainer_id', profile?.trainer_id ?? '')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const moduleIds = (mods ?? []).map(m => m.id)

  const [{ data: progressRows }, { data: choiceRow }] = await Promise.all([
    moduleIds.length
      ? supabase.from('academy_progress').select('module_id, completed_at, completed_steps').eq('learner_id', user!.id).in('module_id', moduleIds)
      : Promise.resolve({ data: [] as { module_id: string; completed_at: string | null; completed_steps: number[] | null }[] }),
    supabase.from('academy_topic_choices').select('topic').eq('learner_id', user!.id).maybeSingle(),
  ])

  const progressMap = new Map((progressRows ?? []).map(r => [r.module_id, r]))

  const modules = await Promise.all((mods ?? []).map(async m => {
    const { html, stepCount } = await renderModuleContent(m.content ?? '')
    const p = progressMap.get(m.id)
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      html,
      stepCount,
      completed: !!p?.completed_at,
      completedSteps: (p?.completed_steps ?? []).filter((s: number) => s < stepCount),
    }
  }))

  return (
    <PreSessionStepper
      teamName={team.name}
      modules={modules}
      initialTopic={(choiceRow?.topic as Topic | undefined) ?? null}
    />
  )
}
