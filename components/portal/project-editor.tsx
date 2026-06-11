'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { marked } from 'marked'
import { saveProject, requestTrainerInput, deleteProject } from '@/actions/projects'
import { ShipProjectButton } from '@/components/portal/ship-project-button'

type Project = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  ai_guide: string
  ai_warnings: string
  trainer_requested: boolean
  trainer_feedback: string
  trainer_responded_at: string | null
  shipped_at: string | null
}

const complexityBar: Record<string, { color: string; bg: string }> = {
  'Beginner-friendly': { color: '#16a34a', bg: '#dcfce7' },
  'Manageable':        { color: '#2563eb', bg: '#dbeafe' },
  'Challenging':       { color: '#d97706', bg: '#fef3c7' },
  'Complex':           { color: '#ea580c', bg: '#ffedd5' },
  'Very Complex':      { color: '#dc2626', bg: '#fee2e2' },
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ComplexityMeter({ score, label, reason }: { score: number; label: string; reason?: string }) {
  if (!score) return null
  const meta = complexityBar[label] ?? complexityBar['Manageable']
  const pct = Math.round((score / 10) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Complexity</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.color }}>
          {label} · {score}/10
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
      </div>
      {reason && <p className="text-xs text-gray-500 italic">{reason}</p>}
    </div>
  )
}

function MarkdownBlock({ md, className }: { md: string; className?: string }) {
  const html = marked.parse(md) as string
  return <div className={`module-content ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}

function TrainerFeedbackPanel({ feedback, respondedAt }: { feedback: string; respondedAt: string | null }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: '0 0 0 3px #2563eb, 0 8px 24px rgba(37,99,235,0.18)' }}>
      {/* Blue header */}
      <div className="px-5 py-4" style={{ backgroundColor: '#1d4ed8' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-white leading-tight">Trainer feedback</p>
            {respondedAt && <p className="text-xs mt-0.5" style={{ color: '#bfdbfe' }}>{fmt(respondedAt)}</p>}
          </div>
        </div>
      </div>

      {/* Feedback body */}
      <div className="bg-white px-5 py-5">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{feedback}</p>
      </div>

      {/* Footer accent */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: '#eff6ff' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs" style={{ color: '#1d4ed8' }}>Review this feedback before generating your guide or asking for more help.</p>
      </div>
    </div>
  )
}

export function ProjectEditor({
  project,
  isFirstProject = false,
  isFirstShip = false,
}: {
  project: Project
  isFirstProject?: boolean
  isFirstShip?: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description)
  const [score, setScore] = useState(project.complexity_score)
  const [label, setLabel] = useState(project.complexity_label)
  const [reason, setReason] = useState('')
  const [starterVersion, setStarterVersion] = useState('')
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [guide, setGuide] = useState(project.ai_guide)
  const [warnings, setWarnings] = useState(project.ai_warnings)
  const [trainerRequested, setTrainerRequested] = useState(project.trainer_requested)

  const [scoringLoading, setScoringLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [requestingTrainer, setRequestingTrainer] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scoreComplexity = useCallback(async (t: string, d: string) => {
    if (d.length < 20) return
    setScoringLoading(true)
    try {
      const res = await fetch('/api/projects/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, description: d, mode: 'complexity' }),
      })
      const data = await res.json()
      if (data.score) {
        setScore(data.score); setLabel(data.label); setReason(data.reason ?? '')
        setStarterVersion(typeof data.starter_version === 'string' ? data.starter_version : '')
      }
    } finally {
      setScoringLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => scoreComplexity(title, description), 900)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title, description, scoreComplexity])

  async function handleSave() {
    setSaving(true)
    await saveProject(project.id, {
      title, description,
      complexityScore: score, complexityLabel: label,
      aiGuide: guide, aiWarnings: warnings,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleGenerateGuide() {
    if (!description.trim()) return
    setAnalysisLoading(true)
    try {
      const res = await fetch('/api/projects/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, mode: 'full' }),
      })
      const data = await res.json()
      if (data.guide) setGuide(data.guide)
      if (data.warnings) setWarnings(data.warnings)
      if (data.score) { setScore(data.score); setLabel(data.label) }
      await saveProject(project.id, {
        title, description,
        complexityScore: data.score ?? score, complexityLabel: data.label ?? label,
        aiGuide: data.guide ?? guide, aiWarnings: data.warnings ?? warnings,
      })
    } finally {
      setAnalysisLoading(false)
    }
  }

  async function handleRequestTrainer() {
    setRequestingTrainer(true)
    await handleSave()
    await requestTrainerInput(project.id)
    setTrainerRequested(true)
    setRequestingTrainer(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete project "${title}"?`)) return
    await deleteProject(project.id)
    router.push('/portal/projects')
  }

  const hasContent = description.trim().length > 0
  const hasFeedback = !!project.trainer_feedback

  return (
    <div className="space-y-6">
      {/* Header — always full width */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.push('/portal/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← My projects
          </button>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Project idea</h1>
        </div>
        <div className="flex items-center gap-2 pt-7">
          <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
          <button onClick={handleDelete} className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Body: two-column when feedback exists, single column otherwise */}
      <div className={hasFeedback
        ? 'grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start'
        : 'space-y-6'
      }>

        {/* Left column: editor + guide + warnings + trainer request */}
        <div className="space-y-6">

          {/* Editor card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Project title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Weekly team newsletter automation"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Describe your idea</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                placeholder="Describe what you want to build or automate with Claude. The more detail you give, the better the guide will be. What problem are you solving? What should the output look like? What tools or data do you have?"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
              />
            </div>

            <div className="relative">
              {scoringLoading && (
                <div className="absolute right-0 top-0 flex items-center gap-1 text-xs text-gray-400">
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Scoring…
                </div>
              )}
              <ComplexityMeter score={score} label={label} reason={reason} />
            </div>

            {isFirstProject && score >= 6 && starterVersion && !nudgeDismissed && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Great ambition!</p>
                      <p className="mt-0.5 text-sm text-blue-900">
                        For your first project, we suggest starting with a smaller version 1 — you can grow it later:
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setNudgeDismissed(true)} className="text-blue-300 hover:text-blue-500 shrink-0" aria-label="Dismiss">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <p className="text-sm text-blue-800 bg-white/70 rounded-md px-3 py-2.5 border border-blue-100">{starterVersion}</p>
                <button
                  onClick={() => { setDescription(starterVersion); setStarterVersion('') }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  Use this as my version 1
                </button>
              </div>
            )}

            {!isFirstProject && score >= 8 && !nudgeDismissed && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                This is an ambitious one — consider slicing it into stages and shipping the first stage on its own.
              </p>
            )}

            <button
              onClick={handleGenerateGuide}
              disabled={!hasContent || analysisLoading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2563eb' }}
            >
              {analysisLoading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Generating guide…
                </>
              ) : guide ? 'Regenerate guide' : 'Generate AI guide →'}
            </button>
          </div>

          {/* AI Guide */}
          {guide && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <MarkdownBlock md={guide} />
            </div>
          )}

          {/* Warnings */}
          {warnings && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <MarkdownBlock md={warnings} className="[&_h2]:text-amber-800 [&_h2]:text-base [&_li]:text-amber-900 [&_p]:text-amber-900" />
              </div>
            </div>
          )}

          {/* Trainer request — only shown in left column when no feedback yet */}
          {guide && !hasFeedback && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="font-heading font-semibold text-gray-800">Trainer input</h2>
                <p className="mt-1 text-sm text-gray-500">Not sure where to start or want a second opinion? Ask your trainer to review this project idea.</p>
              </div>
              {trainerRequested ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Your trainer has been notified and will respond soon.
                </div>
              ) : (
                <button
                  onClick={handleRequestTrainer}
                  disabled={requestingTrainer}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {requestingTrainer ? 'Sending…' : 'Ask trainer for input'}
                </button>
              )}
            </div>
          )}

          {/* Ship moment */}
          {hasContent && (
            <ShipProjectButton
              projectId={project.id}
              projectTitle={title}
              initialShipped={!!project.shipped_at}
              isFirstShip={isFirstShip}
            />
          )}
        </div>

        {/* Right column: prominent trainer feedback panel (sticky on desktop) */}
        {hasFeedback && (
          <div className="lg:sticky lg:top-6">
            <TrainerFeedbackPanel
              feedback={project.trainer_feedback}
              respondedAt={project.trainer_responded_at}
            />
          </div>
        )}
      </div>
    </div>
  )
}
