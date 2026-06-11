'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { setModuleCompleted } from '@/actions/progress'

function fireConfetti() {
  const colors = ['#2563eb', '#16a34a', '#fbbf24', '#dbeafe']
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors })
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors })
    confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors })
  }, 200)
}

export function CompleteButton({
  moduleId,
  initialCompleted,
  moduleTitle,
  nextModule,
}: {
  moduleId: string
  initialCompleted: boolean
  moduleTitle?: string
  nextModule?: { id: string; title: string } | null
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [celebrate, setCelebrate] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const completing = !completed
    startTransition(async () => {
      await setModuleCompleted(moduleId, completing)
      setCompleted(completing)
      if (completing) {
        fireConfetti()
        setCelebrate(true)
      }
    })
  }

  return (
    <>
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {completed ? 'Completed — mark as incomplete' : 'Mark as complete'}
      </button>

      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setCelebrate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">Well done!</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                {moduleTitle ? <>You completed <strong className="text-gray-700">{moduleTitle}</strong>.</> : 'Module completed.'}
                {nextModule ? ' One step closer to AI confidence.' : ' That was the last one — incredible work!'}
              </p>
            </div>
            {nextModule ? (
              <div className="space-y-2">
                <Link
                  href={`/portal/modules/${nextModule.id}`}
                  className="block w-full text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  You&apos;re ready for: {nextModule.title} →
                </Link>
                <button
                  onClick={() => setCelebrate(false)}
                  className="block w-full text-sm font-medium text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Stay here
                </button>
              </div>
            ) : (
              <Link
                href="/portal"
                className="block w-full text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#16a34a' }}
              >
                Back to portal →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
