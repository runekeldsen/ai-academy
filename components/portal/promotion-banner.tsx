'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { dismissPromotion } from '@/actions/promotions'
import { recordResourceView, markResourceCompleted } from '@/actions/resources'

type Promo = {
  id: string
  kind: 'Module' | 'Podcast' | 'Video'
  title: string
  description?: string | null
  href?: string
  resourceId?: string
  src?: string
  youtubeId?: string
}

function FeaturedShell({ kind, title, description, onHide, children }: {
  kind: string
  title: string
  description?: string | null
  onHide: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="relative rounded-2xl border-2 border-blue-300 overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)' }}
    >
      <div className="px-5 pt-4 pb-1 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#2563eb' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#2563eb' }} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#2563eb' }}>
          ★ Featured by your trainer
        </span>
        <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">{kind}</span>
        <button
          onClick={onHide}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400 transition-colors"
          aria-label="Hide this featured item"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          Hide
        </button>
      </div>
      <div className="px-5 pb-5 pt-2 space-y-3">
        <div>
          <h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function PodcastPromo({ promo, onHide }: { promo: Promo; onHide: () => void }) {
  const started = useRef(false)
  const completed = useRef(false)

  function handlePlay() {
    if (!started.current) {
      started.current = true
      if (promo.resourceId) recordResourceView(promo.resourceId)
    }
  }
  function handleEnded() {
    if (!completed.current) {
      completed.current = true
      if (promo.resourceId) markResourceCompleted(promo.resourceId)
    }
  }

  return (
    <FeaturedShell kind="Podcast" title={promo.title} description={promo.description} onHide={onHide}>
      <audio
        controls
        src={promo.src}
        onPlay={handlePlay}
        onEnded={handleEnded}
        className="w-full rounded-lg"
        style={{ accentColor: '#2563eb' }}
      />
    </FeaturedShell>
  )
}

function VideoPromo({ promo, onHide }: { promo: Promo; onHide: () => void }) {
  const [playing, setPlaying] = useState(false)
  const tracked = useRef(false)

  function handlePlay() {
    setPlaying(true)
    if (!tracked.current) {
      tracked.current = true
      if (promo.resourceId) recordResourceView(promo.resourceId)
    }
  }

  return (
    <FeaturedShell kind="Video" title={promo.title} description={promo.description} onHide={onHide}>
      <div className="rounded-lg overflow-hidden border border-blue-200">
        {playing ? (
          <div className="relative" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${promo.youtubeId}?autoplay=1`}
              title={promo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button
            onClick={handlePlay}
            className="relative w-full focus:outline-none group block"
            style={{ paddingTop: '56.25%' }}
            aria-label={`Play ${promo.title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${promo.youtubeId}/hqdefault.jpg`}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(220,38,38,0.92)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
              </div>
            </div>
          </button>
        )}
      </div>
    </FeaturedShell>
  )
}

function ModulePromo({ promo, onHide }: { promo: Promo; onHide: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  function open() {
    setBusy(true)
    router.push(promo.href!)
  }

  return (
    <FeaturedShell kind="Module" title={promo.title} description={promo.description} onHide={onHide}>
      <button
        onClick={open}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: '#2563eb' }}
      >
        {busy ? 'Opening…' : 'Start this module'} <span>→</span>
      </button>
    </FeaturedShell>
  )
}

export function PromotionBanner({ promotions }: { promotions: Promo[] }) {
  const [visible, setVisible] = useState(promotions)

  async function hide(id: string) {
    setVisible(v => v.filter(p => p.id !== id))
    await dismissPromotion(id)
  }

  if (visible.length === 0) return null

  return (
    <div className="space-y-4">
      {visible.map(p =>
        p.kind === 'Podcast' ? <PodcastPromo key={p.id} promo={p} onHide={() => hide(p.id)} />
          : p.kind === 'Video' ? <VideoPromo key={p.id} promo={p} onHide={() => hide(p.id)} />
            : <ModulePromo key={p.id} promo={p} onHide={() => hide(p.id)} />
      )}
    </div>
  )
}
