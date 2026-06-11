import Link from 'next/link'

type HeroModule = {
  id: string
  title: string
  sectionTitle: string
  difficulty: string | null
  duration_minutes: number | null
}

const difficultyStyle: Record<string, string> = {
  Beginner:     'bg-green-400/20 text-green-100 border-green-300/40',
  Intermediate: 'bg-amber-400/20 text-amber-100 border-amber-300/40',
  Advanced:     'bg-red-400/20 text-red-100 border-red-300/40',
}

export function ContinueHero({
  module,
  completed,
  total,
  isNew,
}: {
  module: HeroModule | null
  completed: number
  total: number
  isNew: boolean
}) {
  if (total === 0) return null

  const pct = Math.round((completed / total) * 100)

  if (!module) {
    return (
      <div className="rounded-2xl p-6 sm:p-8 text-white bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
              <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">You&apos;ve completed everything — amazing work!</h2>
            <p className="mt-1 text-sm text-green-100">
              All {total} modules done. Feel free to revisit any module, take a test, or start a project.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const heading = isNew
    ? 'Great news — a new module is ready for you'
    : completed === 0
      ? 'Start here'
      : 'Continue where you left off'

  const sub = completed === 0
    ? 'Your journey starts with this module. Take it one step at a time — we’ll guide you all the way.'
    : `You’ve completed ${completed} of ${total} modules. Keep going — you’re doing great.`

  return (
    <div className="rounded-2xl p-6 sm:p-8 text-white bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">{heading}</p>
          <h2 className="mt-1 font-heading text-xl sm:text-2xl font-bold truncate">{module.title}</h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-blue-200">{module.sectionTitle}</span>
            {module.difficulty && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[module.difficulty] ?? 'bg-white/10 text-blue-100 border-white/20'}`}>
                {module.difficulty}
              </span>
            )}
            {module.duration_minutes && (
              <span className="flex items-center gap-1 text-xs text-blue-200">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {module.duration_minutes} min
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-blue-100 max-w-md">{sub}</p>
        </div>
        <div className="shrink-0 flex flex-col items-start sm:items-end gap-3">
          <Link
            href={`/portal/modules/${module.id}`}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {completed === 0 ? 'Start your first module' : 'Continue'}
            <span aria-hidden>→</span>
          </Link>
          {completed > 0 && (
            <div className="w-full sm:w-44">
              <div className="flex justify-between text-xs text-blue-200 mb-1">
                <span>{completed}/{total} modules</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-1.5 rounded-full bg-white" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
