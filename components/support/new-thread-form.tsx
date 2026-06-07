'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createSupportThread } from '@/actions/support'

export function NewThreadForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  function clearImage() {
    setFile(null)
    setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setIsSubmitting(true)
    setError(null)

    let imageUrl: string | null = null
    if (file) {
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/${Date.now()}.${ext}`
        const { data, uploadError } = await supabase.storage.from('support-images').upload(path, file) as { data: { path: string } | null; uploadError?: Error }
        if (data) {
          imageUrl = supabase.storage.from('support-images').getPublicUrl(data.path).data.publicUrl
        }
      } catch { /* continue without image */ }
    }

    const result = await createSupportThread(subject.trim(), message.trim(), imageUrl)
    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    router.push(`/portal/support/${result.threadId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-heading font-semibold text-gray-800">New question for your trainer</h3>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="What do you need help with?"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe your question in detail…"
          rows={4}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
      </div>

      {previewUrl && (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-200" />
          <button type="button" onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center">×</button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          {file ? file.name : 'Attach image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="submit"
          disabled={isSubmitting || !subject.trim() || !message.trim()}
          className="text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: '#2563eb' }}
        >
          {isSubmitting ? 'Sending…' : 'Send question'}
        </button>
      </div>
    </form>
  )
}
