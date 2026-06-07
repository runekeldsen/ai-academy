'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sendThreadMessage } from '@/actions/support'

export function ThreadReply({ threadId, userId }: { threadId: string; userId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (!message.trim() && !file) return
    setIsSubmitting(true)

    let imageUrl: string | null = null
    if (file) {
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/${Date.now()}.${ext}`
        const { data } = await supabase.storage.from('support-images').upload(path, file)
        if (data) {
          imageUrl = supabase.storage.from('support-images').getPublicUrl(data.path).data.publicUrl
        }
      } catch { /* continue */ }
    }

    await sendThreadMessage(threadId, message.trim(), imageUrl)
    setMessage('')
    clearImage()
    setIsSubmitting(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {previewUrl && (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Preview" className="h-16 w-auto rounded-lg border border-gray-200" />
          <button type="button" onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center">×</button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Attach image"
          className="text-gray-400 hover:text-gray-600 p-1.5 shrink-0 rounded-md hover:bg-gray-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent) } }}
          placeholder="Write a reply… (Enter to send)"
          rows={2}
          className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isSubmitting || (!message.trim() && !file)}
          className="text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 shrink-0"
          style={{ backgroundColor: '#2563eb' }}
        >
          {isSubmitting ? '…' : 'Send'}
        </button>
      </div>
    </form>
  )
}
