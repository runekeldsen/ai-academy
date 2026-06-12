import { createClient } from '@/lib/supabase/server'
import { ResendInviteButton } from '@/components/trainer/resend-invite-button'
import { DeleteLearnerButton } from '@/components/trainer/delete-learner-button'
import { SetPasswordButton } from '@/components/trainer/set-password-button'
import { LearnerTeamSelect } from '@/components/trainer/learner-team-select'
import { headers } from 'next/headers'

type Learner = {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  last_active_at: string | null
  team_id: string | null
}

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function LearnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headersList = await headers()
  const origin = `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const { data: learners } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name, email, created_at, last_active_at, team_id')
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')
    .order('created_at', { ascending: false })

  const { data: teams } = await supabase
    .from('academy_teams')
    .select('id, name')
    .eq('trainer_id', user!.id)
    .order('name', { ascending: true })

  const { data: authStatus } = await supabase
    .rpc('get_user_auth_status', { user_ids: (learners ?? []).map((l: Learner) => l.id) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Learners</h1>
          <p className="mt-1 text-sm text-gray-500">Everyone you&apos;ve invited to Rune's AI Academy.</p>
        </div>
        <a
          href="/trainer/invite"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#2563eb' }}
        >
          + Invite learner
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!learners?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No learners yet.</p>
            <a href="/trainer/invite" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
              Invite your first learner →
            </a>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Team</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invited</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last active</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(learners as Learner[]).map(l => {
                const confirmed = authStatus?.find((a: { id: string; confirmed_at: string | null }) => a.id === l.id)?.confirmed_at
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: '#2563eb' }}
                        >
                          {l.first_name[0]}{l.last_name[0]}
                        </div>
                        {l.first_name} {l.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{l.email}</td>
                    <td className="px-6 py-4">
                      <LearnerTeamSelect
                        learnerId={l.id}
                        currentTeamId={l.team_id}
                        teams={teams ?? []}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {l.last_active_at ? (
                        <span className="text-gray-700" title={new Date(l.last_active_at).toLocaleString('en-GB')}>
                          {timeAgo(l.last_active_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${confirmed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {confirmed ? 'Active' : 'Pending invite'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <a
                          href={`/trainer/learners/${l.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#2563eb' }}
                        >
                          Progress
                        </a>
                        <ResendInviteButton userId={l.id} origin={origin} />
                        <SetPasswordButton userId={l.id} name={`${l.first_name} ${l.last_name}`} />
                        <DeleteLearnerButton userId={l.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
