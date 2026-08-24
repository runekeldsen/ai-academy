'use client'

import { useState } from 'react'
import { chooseTopic } from '@/actions/preSession'
import type { Topic } from '@/lib/topicGuides'

const TOPICS: { id: Topic; title: string; description: string }[] = [
  {
    id: 'financial-review',
    title: 'Monthly financial review',
    description: 'Compare this month vs. last, flag what moved, summarise in plain language.',
  },
  {
    id: 'strategy-review',
    title: 'Strategy review across multiple documents',
    description: 'Pull several documents (and outside research) into one clear strategic summary.',
  },
  {
    id: 'effective-meetings',
    title: 'Effective meetings',
    description: 'Turn raw meeting notes into a clean action log and minutes.',
  },
]

export function TopicChoiceForm({
  currentChoice,
  onChoiceSaved,
}: {
  currentChoice: Topic | null
  onChoiceSaved: (topic: Topic) => void
}) {
  const [selected, setSelected] = useState<Topic | null>(currentChoice)
  const [saving, setSaving] = useState(false)

  async function handleSelect(id: Topic) {
    setSelected(id)
    setSaving(true)
    await chooseTopic(id)
    setSaving(false)
    onChoiceSaved(id)
  }

  return (
    <div className="space-y-3">
      {TOPICS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => handleSelect(t.id)}
          className={`w-full text-left rounded-xl border p-4 transition-colors ${
            selected === t.id ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-heading font-semibold text-gray-800">{t.title}</span>
            {selected === t.id && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                Selected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{t.description}</p>
        </button>
      ))}
      {saving && <p className="text-xs text-gray-400">Saving your choice…</p>}
    </div>
  )
}
