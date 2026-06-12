'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dismissPromotion } from '@/actions/promotions'

type Promo = { id: string; title: string; kind: string; href: string }

function Icon({ kind }: { kind: string }) {
  if (kind === 'Podcast') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    )
  }
  if (kind === 'Video') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9.7 15.5V8.4l8.1 3.6-8.1 3.5z" /><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

export function PromotionBanner({ promotions }: { promotions: Promo[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (promotions.length === 0) return null

  async function open(p: Promo) {
    setBusy(p.id)
    await dismissPromotion(p.id)
    router.push(p.href)
  }

  return (
    <div className="space-y-3">
      {promotions.map(p => (
        <button
          key={p.id}
          onClick={() => open(p)}
          disabled={busy === p.id}
          className="w-full text-left rounded-xl border border-blue-200 px-5 py-4 flex items-center gap-4 transition-all hover:shadow-sm disabled:opacity-60"
          style={{ backgroundColor: '#eff6ff' }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: '#2563eb' }}>
            <Icon kind={p.kind} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#2563eb' }}>
                ★ From your trainer
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">{p.kind}</span>
            </div>
            <h3 className="font-heading font-semibold text-gray-900 truncate mt-0.5">{p.title}</h3>
          </div>
          <span className="text-sm font-medium shrink-0 flex items-center gap-1" style={{ color: '#2563eb' }}>
            {busy === p.id ? 'Opening…' : 'Open'} <span>→</span>
          </span>
        </button>
      ))}
    </div>
  )
}
