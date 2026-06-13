'use client'

import { useState } from 'react'

export function ProjectsIntroModal({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">Welcome to My Projects</h2>
            <p className="mt-1 text-sm text-gray-500">Your space to plan and get help — not where you build the project itself.</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Think of this as your project coach. Describe an idea and you&apos;ll get a sense of how complex it is, a
          step-by-step guide for setting it up, and a place to ask your trainer for help. The project itself gets
          built over in <span className="font-medium text-gray-800">Claude</span> — this section helps you get there.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#dbeafe' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Describe your idea</p>
              <p className="text-sm text-gray-500">Claude gauges how complex it is and writes you a step-by-step guide.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#dbeafe' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Get help &amp; support</p>
              <p className="text-sm text-gray-500">Ask your trainer for feedback or a hand whenever you&apos;re stuck.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#dbeafe' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Set it up in Claude</p>
              <p className="text-sm text-gray-500">Follow your guide and build the real project over in Claude.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-700">
          <span className="font-semibold" style={{ color: '#2563eb' }}>Good to know:</span> You don&apos;t create the
          project here. You build it inside Claude — this is where you get the plan, the guide, and the support to do it.
        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: '#2563eb' }}
        >
          Got it — let&apos;s go
        </button>
      </div>
    </div>
  )
}
