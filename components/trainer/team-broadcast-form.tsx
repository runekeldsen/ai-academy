'use client'

import { useState } from 'react'
import { broadcastToTeam } from '@/actions/email'

export function TeamBroadcastForm({ teamId, recipientCount }: { teamId: string; recipientCount: number }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSending(true); setError(''); setResult(null)
    const res = await broadcastToTeam(teamId, subject, message)
    setSending(false)
    if (res.error) { setError(res.error); return }
    setResult({ sent: res.sent ?? 0, failed: res.failed ?? 0 })
    setSubject(''); setMessage('')
  }

  if (recipientCount === 0) {
    return <p className="text-sm text-gray-400">Add learners to this team before sending a message.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          placeholder="e.g. New module available this week"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={6}
          placeholder="Write your message to the team…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-green-600">
          Sent to {result.sent} learner{result.sent === 1 ? '' : 's'}
          {result.failed > 0 ? ` · ${result.failed} failed` : ''}.
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !subject.trim() || !message.trim()}
        className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition-colors"
        style={{ backgroundColor: '#2563eb' }}
      >
        {sending ? 'Sending…' : `Send to ${recipientCount} learner${recipientCount === 1 ? '' : 's'}`}
      </button>
    </form>
  )
}
