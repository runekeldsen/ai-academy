'use client'

import { useState } from 'react'
import { updateTeamSections } from '@/actions/teams'

type Section = { id: string; title: string }

export function TeamSectionPicker({ teamId, sections, assignedIds }: {
  teamId: string
  sections: Section[]
  assignedIds: string[]
}) {
  const [selected, setSelected] = useState(new Set(assignedIds))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setSaved(false)
  }

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    const res = await updateTeamSections(teamId, [...selected])
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No sections yet.{' '}
        <a href="/trainer/content" className="hover:underline" style={{ color: '#2563eb' }}>Create content first.</a>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {selected.size === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          No sections ticked — this team will see <strong>all</strong> sections.
        </p>
      )}

      <div className="space-y-2">
        {sections.map(s => (
          <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="w-4 h-4 rounded border-gray-300 accent-blue-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">{s.title}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition-colors"
        style={{ backgroundColor: saved ? '#16a34a' : '#2563eb' }}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save sections'}
      </button>
    </div>
  )
}
