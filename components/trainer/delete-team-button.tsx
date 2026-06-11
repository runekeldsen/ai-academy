'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from '@/actions/teams'

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    const res = await deleteTeam(teamId)
    if (res.error) { setLoading(false); setError(res.error); return }
    router.push('/trainer/teams')
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Delete &ldquo;{teamName}&rdquo;?</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            onClick={() => { setConfirming(false); setError('') }}
            className="text-xs text-gray-400 hover:underline"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
    >
      Delete team
    </button>
  )
}
