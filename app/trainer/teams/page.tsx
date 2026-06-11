import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewTeamForm } from '@/components/trainer/new-team-form'

type Team = {
  id: string
  name: string
  welcome_message: string
  learner_count: number
  section_count: number
}

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('academy_teams')
    .select('id, name, welcome_message')
    .eq('trainer_id', user!.id)
    .order('name', { ascending: true })

  const teamIds = (teams ?? []).map(t => t.id)

  // Learner counts per team
  const { data: learnerCounts } = teamIds.length
    ? await supabase
        .from('academy_profiles')
        .select('team_id')
        .eq('trainer_id', user!.id)
        .eq('role', 'learner')
        .in('team_id', teamIds)
    : { data: [] }

  // Section counts per team
  const { data: sectionAssignments } = teamIds.length
    ? await supabase
        .from('academy_team_sections')
        .select('team_id')
        .in('team_id', teamIds)
    : { data: [] }

  const enriched: Team[] = (teams ?? []).map(t => ({
    ...t,
    learner_count: (learnerCounts ?? []).filter(l => l.team_id === t.id).length,
    section_count: (sectionAssignments ?? []).filter(s => s.team_id === t.id).length,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organise learners into teams with custom welcomes and tailored content.
          </p>
        </div>
      </div>

      <NewTeamForm />

      {enriched.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#dbeafe' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-gray-800">No teams yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Create a team to give a group of learners a custom welcome message and their own set of content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map(team => (
            <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#dbeafe' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <Link
                  href={`/trainer/teams/${team.id}`}
                  className="text-sm font-medium hover:underline shrink-0"
                  style={{ color: '#2563eb' }}
                >
                  Manage →
                </Link>
              </div>

              <div>
                <h2 className="font-heading font-semibold text-gray-900">{team.name}</h2>
                {team.welcome_message && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{team.welcome_message}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>{team.learner_count} {team.learner_count === 1 ? 'learner' : 'learners'}</span>
                <span>
                  {team.section_count === 0
                    ? 'All sections'
                    : `${team.section_count} ${team.section_count === 1 ? 'section' : 'sections'}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
