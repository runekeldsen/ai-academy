import { createClient } from '@/lib/supabase/server'
import { getCohortOverview, type CohortFlag } from '@/lib/cohort'

const flagStyle: Record<CohortFlag, { label: string; className: string }> = {
  quiet: { label: 'Gone quiet', className: 'bg-red-50 text-red-700 border-red-200' },
  stalled: { label: 'Stalled', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  'not-started': { label: 'Not started', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  'on-track': { label: 'On track', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  streak: { label: 'On a streak', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'up-to-date': { label: 'Up to date', className: 'bg-green-50 text-green-700 border-green-200' },
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} wk ago`
  return `${Math.floor(days / 30)} mo ago`
}

export default async function TrainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name')
    .eq('id', user!.id)
    .single()

  const { learners, stats, moduleStats, recentActivity } = await getCohortOverview(supabase, user!.id)

  const attentionCount = learners.filter(l => l.flag === 'quiet' || l.flag === 'stalled').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Good to see you, {profile?.first_name ?? 'Trainer'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your Rune's AI Academy cohort.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total learners</p>
          <p className="mt-2 text-3xl font-heading font-bold text-gray-900">{learners.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Active this week</p>
          <p className="mt-2 text-3xl font-heading font-bold" style={{ color: '#2563eb' }}>{stats.activeThisWeek}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Completions this week</p>
          <p className="mt-2 text-3xl font-heading font-bold text-indigo-600">{stats.completionsThisWeek}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Needs attention</p>
          <p className={`mt-2 text-3xl font-heading font-bold ${attentionCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {attentionCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-gray-800">Learner journeys</h2>
            <p className="mt-0.5 text-xs text-gray-400">Learners who need a hand are listed first.</p>
          </div>
          <a href="/trainer/learners" className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
            Manage learners
          </a>
        </div>
        {!learners.length ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No learners yet.</p>
            <a href="/trainer/invite" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
              Invite your first learner →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Now on</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {learners.map(l => {
                  const pct = l.total > 0 ? Math.round((l.completed / l.total) * 100) : 0
                  const flag = flagStyle[l.flag]
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <a href={`/trainer/learners/${l.id}`} className="flex items-center gap-3 group">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: '#2563eb' }}
                          >
                            {l.firstName[0]}{l.lastName[0]}
                          </div>
                          <span className="font-medium text-gray-800 group-hover:underline whitespace-nowrap">
                            {l.firstName} {l.lastName}
                          </span>
                        </a>
                      </td>
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#2563eb' }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{l.completed}/{l.total}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        <span className="text-gray-600 line-clamp-1">
                          {l.completed === l.total && l.total > 0 ? <span className="text-green-700">All done</span> : (l.currentModuleTitle ?? '—')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                          {l.level.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{relativeTime(l.lastActiveAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${flag.className}`}>
                          {flag.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {moduleStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading text-base font-semibold text-gray-800">Module engagement</h2>
            <p className="mt-0.5 text-xs text-gray-400">Modules with the lowest completion are listed first — these are your biggest drop-off points.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Module</th>
                  <th className="px-4 py-3 font-medium min-w-[160px]">Started</th>
                  <th className="px-4 py-3 font-medium min-w-[160px]">Completed</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {moduleStats.map(m => {
                  const startPct = m.totalLearners > 0 ? Math.round((m.startersCount / m.totalLearners) * 100) : 0
                  const completePct = m.totalLearners > 0 ? Math.round((m.completersCount / m.totalLearners) * 100) : 0
                  const rateBadge =
                    m.startersCount === 0
                      ? { label: 'None', className: 'bg-gray-50 text-gray-400 border-gray-100' }
                      : completePct >= 70
                        ? { label: 'High', className: 'bg-green-50 text-green-700 border-green-200' }
                        : completePct >= 40
                          ? { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' }
                          : { label: 'Low', className: 'bg-red-50 text-red-700 border-red-200' }
                  return (
                    <tr key={m.moduleId} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.sectionTitle}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${startPct}%`, backgroundColor: '#2563eb' }} />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{m.startersCount}/{m.totalLearners}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${completePct}%`, backgroundColor: completePct === 100 ? '#16a34a' : '#2563eb' }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{m.completersCount}/{m.totalLearners}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${rateBadge.className}`}>
                          {rateBadge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading text-base font-semibold text-gray-800">Recent completions</h2>
          <p className="mt-0.5 text-xs text-gray-400">The last 10 module completions across your cohort.</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No completions yet — check back once learners start their journey.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentActivity.map((item, i) => {
              const initials = item.learnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <li key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50/60">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 min-w-0">
                    <a href={`/trainer/learners/${item.learnerId}`} className="font-medium text-gray-900 hover:underline">
                      {item.learnerName}
                    </a>
                    {' '}completed{' '}
                    <span className="text-gray-700">{item.moduleTitle}</span>
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{relativeTime(item.completedAt)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
