'use client'

import { useState, useTransition } from 'react'
import { setModuleCompleted } from '@/actions/progress'

export function CompleteButton({ moduleId, initialCompleted }: { moduleId: string; initialCompleted: boolean }) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      await setModuleCompleted(moduleId, !completed)
      setCompleted(c => !c)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${
        completed
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          : 'text-white hover:opacity-90'
      }`}
      style={completed ? {} : { backgroundColor: '#2563eb' }}
    >
      {completed ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Completed — mark as incomplete
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Mark as complete
        </>
      )}
    </button>
  )
}
