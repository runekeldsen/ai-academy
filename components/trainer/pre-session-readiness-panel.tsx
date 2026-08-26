const TOPIC_LABELS: Record<string, string> = {
  'financial-review': 'Monthly financial review',
  'strategy-review': 'Strategy review across multiple documents',
  'effective-meetings': 'Effective meetings',
}

type ReadinessRow = {
  learnerId: string
  name: string
  completed: number
  total: number
  topic: string | null
  ready: boolean
}

export function PreSessionReadinessPanel({ readiness }: { readiness: ReadinessRow[] }) {
  if (readiness.length === 0) {
    return <p className="text-sm text-gray-400">No learners assigned to this team yet.</p>
  }

  const readyCount = readiness.filter(r => r.ready).length
  const pct = Math.round((readyCount / readiness.length) * 100)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-800">{readyCount} of {readiness.length} ready</span>
          <span className="text-gray-400">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#2563eb' }}
          />
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {readiness.map(r => (
          <div key={r.learnerId} className="py-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-800">{r.name}</span>
            {r.ready ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                Ready · {TOPIC_LABELS[r.topic ?? ''] ?? r.topic}
              </span>
            ) : r.completed === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                Not started
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                In progress · {r.completed}/{r.total}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
