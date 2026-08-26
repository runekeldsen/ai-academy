import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeamEditForm } from '@/components/trainer/team-edit-form'
import { DeleteTeamButton } from '@/components/trainer/delete-team-button'
import { TeamSectionPicker } from '@/components/trainer/team-section-picker'
import { TeamLearnerManager } from '@/components/trainer/team-learner-manager'
import { TeamBroadcastForm } from '@/components/trainer/team-broadcast-form'
import { PreSessionReadinessPanel } from '@/components/trainer/pre-session-readiness-panel'

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: team } = await supabase
    .from('academy_teams')
    .select('id, name, welcome_message, academy_name, slug, pre_session_section_id')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!team) notFound()

  // All sections for this trainer
  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title')
    .eq('trainer_id', user!.id)
    .eq('is_pre_session', false)
    .order('sort_order', { ascending: true })

  // Pre-session-only sections, offered as this team's guided-prep path
  const { data: preSessionSections } = await supabase
    .from('academy_sections')
    .select('id, title')
    .eq('trainer_id', user!.id)
    .eq('is_pre_session', true)
    .order('sort_order', { ascending: true })

  // Which sections are currently assigned to this team
  const { data: teamSections } = await supabase
    .from('academy_team_sections')
    .select('section_id')
    .eq('team_id', id)

  const assignedSectionIds = new Set((teamSections ?? []).map(ts => ts.section_id))

  // All learners for this trainer (to show available for assignment)
  const { data: allLearners } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name, email, team_id')
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')
    .order('first_name', { ascending: true })

  const teamLearners = (allLearners ?? []).filter(l => l.team_id === id)
  const unassignedLearners = (allLearners ?? []).filter(l => !l.team_id)

  // Live-session topic choices for this team's learners
  const teamLearnerIds = teamLearners.map(l => l.id)
  const { data: topicChoiceRows } = teamLearnerIds.length
    ? await supabase
        .from('academy_topic_choices')
        .select('learner_id, topic, chosen_at')
        .in('learner_id', teamLearnerIds)
    : { data: [] as { learner_id: string; topic: string; chosen_at: string }[] }

  const learnerNameById = new Map(teamLearners.map(l => [l.id, [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || 'Learner']))

  // Pre-session readiness: has each learner finished every module in the team's guided-prep path?
  const { data: preSessionModules } = team.pre_session_section_id
    ? await supabase
        .from('academy_modules')
        .select('id')
        .eq('section_id', team.pre_session_section_id)
        .eq('published', true)
    : { data: [] as { id: string }[] }

  const preSessionModuleIds = (preSessionModules ?? []).map(m => m.id)
  const totalPreSessionModules = preSessionModuleIds.length

  const { data: preSessionProgressRows } = preSessionModuleIds.length && teamLearnerIds.length
    ? await supabase
        .from('academy_progress')
        .select('learner_id, completed_at')
        .in('learner_id', teamLearnerIds)
        .in('module_id', preSessionModuleIds)
        .not('completed_at', 'is', null)
    : { data: [] as { learner_id: string; completed_at: string | null }[] }

  const completedCountByLearner = new Map<string, number>()
  for (const row of preSessionProgressRows ?? []) {
    completedCountByLearner.set(row.learner_id, (completedCountByLearner.get(row.learner_id) ?? 0) + 1)
  }
  const topicByLearner = new Map((topicChoiceRows ?? []).map(row => [row.learner_id, row.topic]))

  const readiness = teamLearners
    .map(l => {
      const completed = Math.min(completedCountByLearner.get(l.id) ?? 0, totalPreSessionModules)
      const topic = topicByLearner.get(l.id) ?? null
      return {
        learnerId: l.id,
        name: learnerNameById.get(l.id) ?? 'Learner',
        completed,
        total: totalPreSessionModules,
        topic,
        ready: totalPreSessionModules > 0 && completed === totalPreSessionModules && !!topic,
      }
    })
    .sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? 1 : -1
      if (a.completed !== b.completed) return a.completed - b.completed
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <a href="/trainer/teams" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
            ← Teams
          </a>
          <h1 className="font-heading text-2xl font-bold text-gray-900">{team.name}</h1>
        </div>
        <DeleteTeamButton teamId={id} teamName={team.name} />
      </div>

      {/* Team details */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-gray-800">Team details</h2>
        <TeamEditForm
          teamId={id}
          name={team.name}
          welcomeMessage={team.welcome_message}
          academyName={team.academy_name ?? ''}
          slug={team.slug ?? ''}
          preSessionSections={(preSessionSections ?? []).map(s => ({ id: s.id, title: s.title }))}
          preSessionSectionId={team.pre_session_section_id}
        />
      </section>

      {/* Sections */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-gray-800">Content sections</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tick the sections this team can see. Leave all unticked to show every section.
          </p>
        </div>
        <TeamSectionPicker
          teamId={id}
          sections={(sections ?? []).map(s => ({ id: s.id, title: s.title }))}
          assignedIds={[...assignedSectionIds]}
        />
      </section>

      {/* Pre-session readiness */}
      {team.pre_session_section_id && (
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-gray-800">Live session readiness</h2>
            <p className="mt-1 text-sm text-gray-500">
              Who&apos;s finished the pre-session path and picked a project, vs. who still needs a nudge.
            </p>
          </div>
          <PreSessionReadinessPanel readiness={readiness} />
        </section>
      )}

      {/* Learners */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-gray-800">Learners</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add learners to this team or remove them.
          </p>
        </div>
        <TeamLearnerManager
          teamId={id}
          teamLearners={teamLearners.map(l => ({ id: l.id, first_name: l.first_name, last_name: l.last_name, email: l.email }))}
          unassignedLearners={unassignedLearners.map(l => ({ id: l.id, first_name: l.first_name, last_name: l.last_name, email: l.email }))}
        />
      </section>

      {/* Broadcast */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold text-gray-800">Message this team</h2>
          <p className="mt-1 text-sm text-gray-500">
            Send an email to everyone in this team — e.g. a new-content announcement.
          </p>
        </div>
        <TeamBroadcastForm teamId={id} recipientCount={teamLearners.length} />
      </section>
    </div>
  )
}
