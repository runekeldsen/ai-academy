import { createClient } from '@/lib/supabase/server'

export default async function TrainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name')
    .eq('id', user!.id)
    .single()

  const { data: learners } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name, created_at')
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')
    .order('created_at', { ascending: false })

  const { data: allLearners } = await supabase
    .rpc('get_user_auth_status', { user_ids: (learners ?? []).map((l: { id: string }) => l.id) })

  const confirmedCount = allLearners?.filter((l: { id: string; confirmed_at: string | null }) => l.confirmed_at).length ?? 0
  const pendingCount = (learners?.length ?? 0) - confirmedCount

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Good to see you, {profile?.first_name ?? 'Trainer'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s an overview of your Rune's AI Academy cohort.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total learners</p>
          <p className="mt-2 text-3xl font-heading font-bold text-gray-900">{learners?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Active accounts</p>
          <p className="mt-2 text-3xl font-heading font-bold" style={{ color: '#2563eb' }}>{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Pending invites</p>
          <p className="mt-2 text-3xl font-heading font-bold text-amber-500">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-gray-800">Recent learners</h2>
          <a href="/trainer/learners" className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
            View all
          </a>
        </div>
        {!learners?.length ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No learners yet.</p>
            <a href="/trainer/invite" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
              Invite your first learner →
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(learners as { id: string; first_name: string; last_name: string }[]).slice(0, 5).map(l => {
              const confirmed = allLearners?.find((a: { id: string; confirmed_at: string | null }) => a.id === l.id)?.confirmed_at
              return (
                <li key={l.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      {l.first_name[0]}{l.last_name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{l.first_name} {l.last_name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confirmed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {confirmed ? 'Active' : 'Pending invite'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
