import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Test = {
  id: string
  title: string
  description: string | null
  academy_test_questions: { id: string }[]
  academy_modules: { title: string } | null
}

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
    .eq('id', user!.id)
    .single()

  const { data: tests } = await supabase
    .from('academy_skill_tests')
    .select('id, title, description, academy_test_questions(id), academy_modules(title)')
    .eq('trainer_id', profile?.trainer_id ?? '')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const { data: attempts } = await supabase
    .from('academy_test_attempts')
    .select('test_id, completed_at, answers')
    .eq('learner_id', user!.id)
    .not('completed_at', 'is', null)

  const latestAttempt = new Map<string, { score: number }>()
  for (const a of (attempts ?? [])) {
    const answers = (a.answers as { score: number }[]) ?? []
    const avg = answers.length > 0 ? Math.round(answers.reduce((s, q) => s + (q.score ?? 0), 0) / answers.length) : 0
    if (!latestAttempt.has(a.test_id)) latestAttempt.set(a.test_id, { score: avg })
  }

  const testList = (tests as unknown as Test[]) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Test your skills</h1>
        <p className="mt-1 text-sm text-gray-500">Put what you've learned to the test.</p>
      </div>

      {testList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dbeafe' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-gray-800">No tests available yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">Your trainer will publish skill tests here once you've worked through the modules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testList.map(test => {
            const attempt = latestAttempt.get(test.id)
            const questionCount = test.academy_test_questions?.length ?? 0
            return (
              <Link
                key={test.id}
                href={`/portal/tests/${test.id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm motion-safe:hover:-translate-y-0.5 transition-all p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: attempt ? '#dcfce7' : '#dbeafe' }}>
                    {attempt ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                  </div>
                  {attempt && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                      Score: {attempt.score}%
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{test.title}</h3>
                  {test.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{test.description}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                    {test.academy_modules && (
                      <span className="text-xs text-gray-400 truncate">· {test.academy_modules.title}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: '#2563eb' }}>
                    {attempt ? 'Retake' : 'Start'} →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
