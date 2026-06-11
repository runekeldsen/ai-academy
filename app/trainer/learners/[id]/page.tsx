import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrainerProjectFeedback } from '@/components/trainer/trainer-project-feedback'

type Progress = { module_id: string; started_at: string; completed_at: string | null; completed_steps: number[] | null }
type Module = { id: string; title: string; published: boolean; content: string | null }
type Section = { id: string; title: string; academy_modules: Module[] }
type AnswerRecord = { questionId: string; answer: string; feedback: string; correct: boolean; score: number }
type TestAttempt = {
  id: string
  completed_at: string | null
  started_at: string
  answers: AnswerRecord[]
  academy_skill_tests: { title: string; description: string | null; academy_test_questions: { id: string }[] } | null
}
type Project = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  ai_guide: string
  trainer_requested: boolean
  trainer_feedback: string
  updated_at: string
}

const complexityColor: Record<string, string> = {
  'Beginner-friendly': 'bg-green-50 text-green-700 border-green-200',
  'Manageable':        'bg-blue-50 text-blue-700 border-blue-200',
  'Challenging':       'bg-amber-50 text-amber-700 border-amber-200',
  'Complex':           'bg-orange-50 text-orange-700 border-orange-200',
  'Very Complex':      'bg-red-50 text-red-700 border-red-200',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function LearnerProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: learnerId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: learner } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name, email')
    .eq('id', learnerId)
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')
    .single()

  if (!learner) notFound()

  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title, academy_modules(id, title, published, content)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: true })

  const { data: progressRows } = await supabase
    .from('academy_progress')
    .select('module_id, started_at, completed_at, completed_steps')
    .eq('learner_id', learnerId)

  const { data: attempts } = await supabase
    .from('academy_test_attempts')
    .select('id, completed_at, started_at, answers, academy_skill_tests(title, description, academy_test_questions(id))')
    .eq('learner_id', learnerId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  const { data: projects } = await supabase
    .from('academy_projects')
    .select('id, title, description, complexity_score, complexity_label, ai_guide, trainer_requested, trainer_feedback, updated_at')
    .eq('learner_id', learnerId)
    .eq('trainer_id', user!.id)
    .order('updated_at', { ascending: false })

  // Resources this learner has engaged with
  const { data: allResources } = await supabase
    .from('academy_resources')
    .select('id, title, type')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: true })

  const { data: resourceViews } = await supabase
    .from('academy_resource_views')
    .select('resource_id, started_at, completed_at')
    .eq('learner_id', learnerId)

  const resourceViewMap = new Map((resourceViews ?? []).map(v => [v.resource_id, v]))

  const progressMap = new Map<string, Progress>()
  for (const row of (progressRows ?? [])) {
    progressMap.set(row.module_id, row)
  }

  const testAttempts = (attempts as unknown as TestAttempt[]) ?? []

  const allSections = ((sections as Section[]) ?? []).map(s => ({
    ...s,
    academy_modules: s.academy_modules ?? [],
  }))

  const totalModules = allSections.reduce((sum, s) => sum + s.academy_modules.filter(m => m.published).length, 0)
  const startedCount = allSections.reduce((sum, s) => sum + s.academy_modules.filter(m => progressMap.has(m.id)).length, 0)
  const completedCount = allSections.reduce((sum, s) => sum + s.academy_modules.filter(m => progressMap.get(m.id)?.completed_at).length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/trainer/learners"
          className="text-sm font-medium hover:underline flex items-center gap-1"
          style={{ color: '#2563eb' }}
        >
          ← All learners
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
          style={{ backgroundColor: '#2563eb' }}
        >
          {learner.first_name[0]}{learner.last_name[0]}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {learner.first_name} {learner.last_name}
          </h1>
          <p className="text-sm text-gray-500">{learner.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalModules}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total modules</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold" style={{ color: '#2563eb' }}>{startedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Started</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-purple-600">{testAttempts.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Tests taken</div>
        </div>
      </div>

      <div className="space-y-6">
        {allSections.map(section => (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-heading font-semibold text-gray-800">{section.title}</h2>
            </div>
            {section.academy_modules.length === 0 ? (
              <div className="px-6 py-4 text-sm text-gray-400">No modules in this section.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Steps</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Opened</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {section.academy_modules.map(mod => {
                    const p = progressMap.get(mod.id)
                    const isCompleted = !!p?.completed_at
                    const isStarted = !!p?.started_at && !isCompleted
                    const stepCount = (mod.content?.match(/^##\s+step\s+\d+/gim) ?? []).length
                    const stepsDone = (p?.completed_steps ?? []).filter(s => s < stepCount).length

                    return (
                      <tr key={mod.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            {mod.title}
                            {!mod.published && (
                              <span className="text-xs text-gray-400 font-normal">(unpublished)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Completed
                            </span>
                          ) : isStarted ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                              In progress
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not started</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 tabular-nums">
                          {stepCount > 0 ? `${stepsDone}/${stepCount}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {p?.started_at ? fmt(p.started_at) : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {p?.completed_at ? fmt(p.completed_at) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {/* Resources */}
      {(allResources ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-heading font-semibold text-gray-800">Resources</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(allResources as { id: string; title: string; type: string }[]).map(r => {
                const view = resourceViewMap.get(r.id)
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">{r.title}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.type === 'youtube'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {r.type === 'youtube' ? 'Video' : 'Podcast'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {!view ? (
                        <span className="text-xs text-gray-400">Not started</span>
                      ) : view.completed_at ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {r.type === 'youtube' ? 'Watched' : 'Listened'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Started
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {view ? fmt(view.started_at) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-gray-800">Projects</h2>
          {(projects ?? []).length > 0 && (
            <Link href="/trainer/projects" className="text-xs hover:underline" style={{ color: '#2563eb' }}>
              View all projects →
            </Link>
          )}
        </div>
        {!(projects ?? []).length ? (
          <div className="px-6 py-6 text-sm text-gray-400">No projects yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(projects as Project[]).map(p => (
              <div key={p.id} className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(p.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.trainer_requested && !p.trainer_feedback && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Awaiting input</span>
                    )}
                    {p.complexity_label && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${complexityColor[p.complexity_label] ?? ''}`}>
                        {p.complexity_label}
                      </span>
                    )}
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{p.description}</p>
                )}
                {p.ai_guide && (
                  <details className="group">
                    <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-90 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
                      AI guide
                    </summary>
                    <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap border-l-2 border-gray-100 pl-3">{p.ai_guide}</div>
                  </details>
                )}
                {p.trainer_requested && (
                  <TrainerProjectFeedback projectId={p.id} existingFeedback={p.trainer_feedback} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test results */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-heading font-semibold text-gray-800">Test results</h2>
        </div>
        {testAttempts.length === 0 ? (
          <div className="px-6 py-6 text-sm text-gray-400">No tests taken yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Test</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Result</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testAttempts.map(attempt => {
                const answers = attempt.answers ?? []
                const score = answers.length > 0
                  ? Math.round(answers.reduce((s, a) => s + (a.score ?? 0), 0) / answers.length)
                  : 0
                const passed = score >= 60
                const total = attempt.academy_skill_tests?.academy_test_questions?.length ?? answers.length

                return (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {attempt.academy_skill_tests?.title ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${score}%`, backgroundColor: passed ? '#16a34a' : '#f59e0b' }}
                          />
                        </div>
                        <span className="font-semibold text-gray-800 tabular-nums">{score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {passed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Not passed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {answers.length} / {total}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {attempt.completed_at ? fmt(attempt.completed_at) : '—'}
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
