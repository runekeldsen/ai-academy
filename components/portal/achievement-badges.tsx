import { ProgressRing } from '@/components/portal/progress-ring'
import type { Motivation } from '@/lib/achievements'

export function GrowthCard({ motivation }: { motivation: Motivation }) {
  const { achievements, level, nextLevel, pctToNextLevel, points, upToDate } = motivation

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex items-center gap-4 shrink-0">
          <ProgressRing pct={pctToNextLevel} color={nextLevel ? '#2563eb' : '#16a34a'}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={nextLevel ? '#2563eb' : '#16a34a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </ProgressRing>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Your AI level</p>
            <p className="font-heading text-lg font-bold text-gray-900">{level.label}</p>
            <p className="text-xs text-gray-400">
              {nextLevel
                ? `${pctToNextLevel}% of the way to ${nextLevel.label}`
                : 'Top level reached!'}
            </p>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Achievements</p>
            <div className="flex items-center gap-2">
              {upToDate && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  Up to date
                </span>
              )}
              <span className="text-xs text-gray-400 tabular-nums">{points} points</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {achievements.map(a => (
              <span
                key={a.id}
                title={a.earned ? `Earned${a.earnedAt ? ' ' + new Date(a.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}` : a.hint}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  a.earned
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {a.earned ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                )}
                {a.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
