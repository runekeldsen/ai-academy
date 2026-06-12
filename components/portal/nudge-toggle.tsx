'use client'

import { useState, useTransition } from 'react'
import { updateEmailNudges } from '@/actions/profile'

export function NudgeToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setError('')
    startTransition(async () => {
      const res = await updateEmailNudges(next)
      if (res.error) {
        setEnabled(!next)
        setError(res.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-semibold text-gray-800">Email reminders</h2>
          <p className="mt-1 text-sm text-gray-500">
            Get a friendly nudge when your trainer responds, a weekly progress summary, and a reminder if you&apos;ve been away for a while.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          style={{ backgroundColor: enabled ? '#2563eb' : '#d1d5db' }}
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
            style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
