'use client'

import { useState } from 'react'
import { deleteLearner } from '@/actions/learners'

export function DeleteLearnerButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await deleteLearner(userId)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-500 hover:underline"
    >
      Delete
    </button>
  )
}
