'use client'

import { useState } from 'react'
import { assignLearnerToTeam } from '@/actions/teams'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string }

export function LearnerTeamSelect({ learnerId, currentTeamId, teams }: {
  learnerId: string
  currentTeamId: string | null
  teams: Team[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setSaving(true)
    setError('')
    const res = await assignLearnerToTeam(learnerId, value || null)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-0.5">
      <select
        defaultValue={currentTeamId ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="text-xs rounded border border-gray-200 px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 bg-white"
      >
        <option value="">No team</option>
        {teams.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
