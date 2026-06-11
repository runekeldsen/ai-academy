'use client'

import { useState, useEffect } from 'react'
import { markWelcomeSeen } from '@/actions/profile'

export function WelcomeDialog({
  firstName,
  teamName,
  teamWelcomeMessage,
}: {
  firstName: string
  teamName?: string | null
  teamWelcomeMessage?: string | null
}) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleClose() {
    setClosing(true)
    markWelcomeSeen()
    setTimeout(() => setGone(true), 350)
  }

  if (gone) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: closing ? 'rgba(15,23,42,0)' : 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        transition: 'background-color 350ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          opacity: mounted && !closing ? 1 : 0,
          transform: mounted && !closing ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 350ms ease, transform 350ms ease',
        }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header gradient */}
        <div
          className="relative px-8 pt-10 pb-8 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-10 -left-4 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold leading-tight">
              Welcome, {firstName}!
            </h2>
            <p className="mt-1.5 text-blue-100 text-sm">
              Your AI Academy learning path is ready.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            Work through the modules at your own pace, complete knowledge checks, and track your progress as you go. Everything you need is in the sidebar.
          </p>

          {teamName && teamWelcomeMessage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {teamName}
                </span>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">
                {teamWelcomeMessage}
              </p>
            </div>
          )}

          {teamName && !teamWelcomeMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <p className="text-sm text-blue-800">
                You&apos;re part of the <strong>{teamName}</strong> team.
              </p>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: '#2563eb' }}
          >
            Let&apos;s get started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
