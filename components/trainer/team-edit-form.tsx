'use client'

import { useState } from 'react'
import { updateTeam } from '@/actions/teams'

export function TeamEditForm({ teamId, name: initialName, welcomeMessage: initialWelcome }: {
  teamId: string
  name: string
  welcomeMessage: string
}) {
  const [name, setName] = useState(initialName)
  const [welcome, setWelcome] = useState(initialWelcome)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError(''); setSaved(false)
    const res = await updateTeam(teamId, { name, welcomeMessage: welcome })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Team name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Welcome message <span className="text-gray-400 font-normal">(shown at the top of each learner&apos;s portal)</span>
        </label>
        <textarea
          value={welcome}
          onChange={e => setWelcome(e.target.value)}
          placeholder="Welcome to your AI training programme! Here you'll find everything you need…"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition-colors"
        style={{ backgroundColor: saved ? '#16a34a' : '#2563eb' }}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </form>
  )
}
