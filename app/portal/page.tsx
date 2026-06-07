import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Module = { id: string; title: string; description: string | null }
type Section = { id: string; title: string; academy_modules: Module[] }

export default async function LearnerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, trainer_id')
    .eq('id', user!.id)
    .single()

  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title, academy_modules(id, title, description)')
    .eq('trainer_id', profile?.trainer_id ?? '')
    .order('created_at', { ascending: true })

  const publishedSections = ((sections as Section[]) ?? [])
    .map(s => ({ ...s, academy_modules: s.academy_modules ?? [] }))
    .filter(s => s.academy_modules.length > 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Welcome, {profile?.first_name ?? 'Learner'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your AI Academy training programme.</p>
      </div>

      {publishedSections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3">
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
            Your trainer will publish modules here for you to work through.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {publishedSections.map(section => (
            <div key={section.id} className="space-y-4">
              <h2 className="font-heading text-lg font-semibold text-gray-800">{section.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.academy_modules.map(mod => (
                  <Link
                    key={mod.id}
                    href={`/portal/modules/${mod.id}`}
                    className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all space-y-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#dbeafe' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{mod.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2563eb' }}>
                      Start <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
