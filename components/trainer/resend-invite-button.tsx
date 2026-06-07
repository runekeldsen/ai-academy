'use client'

import { useState } from 'react'
import { resendInvite } from '@/actions/learners'

export function ResendInviteButton({ userId, origin }: { userId: string; origin: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const result = await resendInvite(userId, origin)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return <span className="text-xs text-green-600 font-medium">Sent!</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-medium hover:underline disabled:opacity-50"
        style={{ color: '#2563eb' }}
      >
        {loading ? 'Sending…' : 'Resend invite'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
