'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTeam } from '@/actions/teams'

export function NewTeamForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [welcome, setWelcome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const res = await createTeam({ name, welcomeMessage: welcome })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setName(''); setWelcome(''); setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors w-fit"
        style={{ backgroundColor: '#2563eb' }}
      >
        + New team
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-lg">
      <h2 className="font-heading text-base font-semibold text-gray-800">New team</h2>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Team name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Enterprise, Marketing Team…"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Welcome message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={welcome}
          onChange={e => setWelcome(e.target.value)}
          placeholder="Shown at the top of the portal for everyone in this team…"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#2563eb' }}
        >
          {saving ? 'Creating…' : 'Create team'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setName(''); setWelcome(''); setError('') }}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
