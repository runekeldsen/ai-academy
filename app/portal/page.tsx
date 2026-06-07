import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Module = { id: string; title: string; description: string | null; difficulty: string | null; duration_minutes: number | null }
type Section = { id: string; title: string; academy_modules: Module[] }
type Progress = { module_id: string; started_at: string; completed_at: string | null }

const difficultyStyle: Record<string, string> = {
  Beginner:     'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced:     'bg-red-50 text-red-700 border-red-200',
}

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
    .select('id, title, academy_modules(id, title, description, difficulty, duration_minutes)')
    .eq('trainer_id', profile?.trainer_id ?? '')
    .order('created_at', { ascending: true })

  const { data: progressRows } = await supabase
    .from('academy_progress')
    .select('module_id, started_at, completed_at')
    .eq('learner_id', user!.id)

  const progressMap = new Map<string, Progress>()
  for (const row of (progressRows ?? [])) {
    progressMap.set(row.module_id, row)
  }

  const publishedSections = ((sections as Section[]) ?? [])
    .map(s => ({ ...s, academy_modules: s.academy_modules ?? [] }))
    .filter(s => s.academy_modules.length > 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Welcome, {profile?.first_name ?? 'Learner'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your Rune's AI Academy training programme.</p>
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
          {publishedSections.map(section => {
            const total = section.academy_modules.length
            const completed = section.academy_modules.filter(m => progressMap.get(m.id)?.completed_at).length
            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-gray-800">{section.title}</h2>
                  <span className="text-xs text-gray-400">{completed}/{total} completed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.academy_modules.map(mod => {
                    const p = progressMap.get(mod.id)
                    const isCompleted = !!p?.completed_at
                    const isStarted = !!p?.started_at && !isCompleted

                    return (
                      <Link
                        key={mod.id}
                        href={`/portal/modules/${mod.id}`}
                        className={`group bg-white rounded-xl border p-5 hover:shadow-sm transition-all flex flex-col gap-3 ${
                          isCompleted
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: isCompleted ? '#dcfce7' : '#dbeafe' }}
                          >
                            {isCompleted ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                              </svg>
                            )}
                          </div>
                          {isCompleted && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                              Completed
                            </span>
                          )}
                          {isStarted && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                              In progress
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className={`font-heading font-semibold transition-colors ${
                            isCompleted ? 'text-gray-700' : 'text-gray-800 group-hover:text-blue-600'
                          }`}>
                            {mod.title}
                          </h3>
                          {mod.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{mod.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {mod.difficulty && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[mod.difficulty] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {mod.difficulty}
                              </span>
                            )}
                            {mod.duration_minutes && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {mod.duration_minutes} min
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium flex items-center gap-1 ${isCompleted ? 'text-gray-400' : ''}`} style={isCompleted ? {} : { color: '#2563eb' }}>
                            {isCompleted ? 'Review' : 'Start'} <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
