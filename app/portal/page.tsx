import { createClient } from '@/lib/supabase/server'

export default async function LearnerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Welcome, {profile?.first_name ?? 'Learner'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your AI Academy portal. More content is coming soon.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: '#dbeafe' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold text-gray-800">Your training starts here</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your trainer will share materials, exercises, and resources with you through this portal.
        </p>
      </div>
    </div>
  )
}
