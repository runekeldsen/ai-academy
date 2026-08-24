const TOPIC_LABELS: Record<string, string> = {
  'financial-review': 'Monthly financial review',
  'strategy-review': 'Strategy review across multiple documents',
  'effective-meetings': 'Effective meetings',
}

export function TopicChoicesPanel({
  choices,
}: {
  choices: { learnerId: string; name: string; topic: string; chosenAt: string }[]
}) {
  if (choices.length === 0) {
    return <p className="text-sm text-gray-400">No one has picked a live-session topic yet.</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {choices.map(c => (
        <div key={c.learnerId} className="py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-800">{c.name}</span>
          <span className="text-sm text-gray-500">{TOPIC_LABELS[c.topic] ?? c.topic}</span>
        </div>
      ))}
    </div>
  )
}
