'use client'

import { useState } from 'react'
import { saveTrainerFeedback } from '@/actions/projects'

export function TrainerProjectFeedback({ projectId, existingFeedback }: { projectId: string; existingFeedback: string }) {
  const [feedback, setFeedback] = useState(existingFeedback)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!feedback.trim()) return
    setSaving(true)
    await saveTrainerFeedback(projectId, feedback.trim())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your feedback</p>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        rows={4}
        placeholder="Share your thoughts on this project idea — what looks good, what to watch out for, suggested next steps…"
        className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
      />
      <button
        onClick={handleSave}
        disabled={saving || !feedback.trim()}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
        style={{ backgroundColor: '#2563eb' }}
      >
        {saving ? 'Sending…' : saved ? '✓ Sent' : 'Send feedback'}
      </button>
    </div>
  )
}
