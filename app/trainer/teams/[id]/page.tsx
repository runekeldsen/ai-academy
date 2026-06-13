import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TeamEditForm } from '@/components/trainer/team-edit-form'
import { DeleteTeamButton } from '@/components/trainer/delete-team-button'
import { TeamSectionPicker } from '@/components/trainer/team-section-picker'
import { TeamLearnerManager } from '@/components/trainer/team-learner-manager'

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: team } = await supabase
    .from('academy_teams')
    .select('id, name, welcome_message, academy_name')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!team) notFound()

  // All sections for this trainer
  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title')
    .eq('trainer_id', user!.id)
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
        <TeamEditForm teamId={id} name={team.name} welcomeMessage={team.welcome_message} academyName={team.academy_name ?? ''} />
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
    </div>
  )
}
