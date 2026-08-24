'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModuleContent } from '@/components/portal/module-content'
import { TopicChoiceForm } from '@/components/portal/topic-choice-form'
import { setModuleCompleted } from '@/actions/progress'
import { dismissPreSession, redoPreSession } from '@/actions/preSession'
import type { Topic } from '@/lib/topicGuides'

type Mod = {
  id: string
  title: string
  description: string | null
  html: string
  stepCount: number
  completed: boolean
  completedSteps: number[]
}

export function PreSessionStepper({
  teamName,
  modules,
  initialTopic,
}: {
  teamName: string | null
  modules: Mod[]
  initialTopic: Topic | null
}) {
  const router = useRouter()
  const firstIncomplete = modules.findIndex(m => !m.completed)
  const [index, setIndex] = useState(firstIncomplete === -1 ? modules.length - 1 : firstIncomplete)
  const [finished, setFinished] = useState(firstIncomplete === -1 && !!initialTopic)
  const [topic, setTopic] = useState<Topic | null>(initialTopic)
  const [saving, setSaving] = useState(false)
  const [confirmingRedo, setConfirmingRedo] = useState(false)
  const [redoing, setRedoing] = useState(false)

  async function handleSkip() {
    await dismissPreSession()
    router.push('/portal')
  }

  async function handleContinue() {
    const current = modules[index]
    setSaving(true)
    await setModuleCompleted(current.id, true)
    setSaving(false)
    if (index < modules.length - 1) {
      setIndex(index + 1)
    } else {
      setFinished(true)
    }
  }

  async function handleFinish() {
    await dismissPreSession()
    router.push('/portal')
  }

  async function handleRedo() {
    setRedoing(true)
    await redoPreSession()
    // Full reload so every module's progress and the topic choice re-fetch clean
    window.location.href = '/portal/pre-session'
  }

  if (modules.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-3 py-16">
        <h1 className="font-heading text-xl font-semibold text-gray-800">Nothing here yet</h1>
        <p className="text-sm text-gray-500">Your trainer hasn&apos;t published the pre-session content yet.</p>
        <button onClick={handleSkip} className="text-sm font-medium" style={{ color: '#2563eb' }}>
          Go to normal AI Training →
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-16">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto text-3xl">
          🎉
        </div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">You&apos;re ready!</h1>
        <p className="text-gray-500">
          You&apos;ve walked through the basics and picked your project. See you at the live session.
        </p>

        {topic && (
          <Link
            href={`/portal/pre-session/guide/${topic}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#2563eb', color: '#2563eb' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Download your guide
          </Link>
        )}

        <div>
          <button
            onClick={handleFinish}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#2563eb' }}
          >
            Go to normal AI Training →
          </button>
        </div>

        <div>
          {confirmingRedo ? (
            <div className="inline-flex items-center gap-2">
              <span className="text-xs text-gray-500">This clears your progress and topic choice. Sure?</span>
              <button
                onClick={handleRedo}
                disabled={redoing}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                {redoing ? 'Resetting…' : 'Yes, start over'}
              </button>
              <button
                onClick={() => setConfirmingRedo(false)}
                className="text-xs text-gray-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingRedo(true)}
              className="text-xs font-medium text-gray-400 hover:text-gray-600"
            >
              Redo the session
            </button>
          )}
        </div>
      </div>
    )
  }

  const current = modules[index]
  const isLast = index === modules.length - 1
  const canContinue = !isLast || !!topic

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {teamName ? `${teamName} · ` : ''}Get ready for the live session
        </p>
        <button onClick={handleSkip} className="text-xs font-medium text-gray-400 hover:text-gray-600 shrink-0">
          Skip to normal AI Training →
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {modules.map((m, i) => (
            <div
              key={m.id}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= index ? '#2563eb' : '#e5e7eb' }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">Step {index + 1} of {modules.length}</p>
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-gray-900">{current.title}</h1>
        {current.description && <p className="text-gray-500">{current.description}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <ModuleContent
          html={current.html}
          moduleId={current.id}
          stepCount={current.stepCount}
          initialCompletedSteps={current.completedSteps}
        />
      </div>

      {isLast && <TopicChoiceForm currentChoice={topic} onChoiceSaved={setTopic} />}

      <div className="flex items-center justify-between pt-2">
        {index > 0 ? (
          <button onClick={() => setIndex(index - 1)} className="text-sm font-medium text-gray-400 hover:text-gray-600">
            ← Back
          </button>
        ) : <span />}
        <button
          onClick={handleContinue}
          disabled={saving || !canContinue}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#2563eb' }}
        >
          {saving ? 'Saving…' : isLast ? 'Finish' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
