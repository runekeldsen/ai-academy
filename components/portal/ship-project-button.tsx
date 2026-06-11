'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { setProjectShipped } from '@/actions/projects'

function fireConfetti() {
  const colors = ['#2563eb', '#16a34a', '#fbbf24', '#dbeafe']
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors })
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors })
    confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors })
  }, 200)
}

export function ShipProjectButton({
  projectId,
  projectTitle,
  initialShipped,
  isFirstShip,
}: {
  projectId: string
  projectTitle: string
  initialShipped: boolean
  isFirstShip: boolean
}) {
  const [shipped, setShipped] = useState(initialShipped)
  const [celebrate, setCelebrate] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const shipping = !shipped
    startTransition(async () => {
      await setProjectShipped(projectId, shipping)
      setShipped(shipping)
      if (shipping) {
        fireConfetti()
        setCelebrate(true)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-gray-800">Is it working?</h2>
        <p className="mt-1 text-sm text-gray-500">
          When your project does what you wanted — even a simple first version — mark it as shipped. That&apos;s a real win.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${
          shipped
            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            : 'text-white hover:opacity-90'
        }`}
        style={shipped ? {} : { backgroundColor: '#2563eb' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {shipped ? 'Shipped — mark as not shipped' : "It's working — mark as shipped 🚀"}
      </button>

      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setCelebrate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-7 space-y-5">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">You shipped a project!</h2>
                <p className="mt-1.5 text-sm text-gray-500">
                  {isFirstShip
                    ? <>Your first project is live — this is the hardest one, and you did it.</>
                    : <>You got <strong className="text-gray-700">{projectTitle}</strong> working. Another real win.</>}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Grow it from here</p>
              <ul className="space-y-1.5 text-sm text-blue-900">
                <li className="flex gap-2"><span>1.</span>Add more context so Claude knows your world better</li>
                <li className="flex gap-2"><span>2.</span>Turn the repeatable part into a Skill</li>
                <li className="flex gap-2"><span>3.</span>Start your next idea — keep it small again</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/portal/projects"
                className="block w-full text-center text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#2563eb' }}
              >
                Back to my projects →
              </Link>
              <button
                onClick={() => setCelebrate(false)}
                className="block w-full text-sm font-medium text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
