'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { sendThreadMessage, resolveThread, reopenThread } from '@/actions/support'

type Profile = { id: string; first_name: string; last_name: string }
type Message = {
  id: string
  role: string
  content: string
  image_url: string | null
  created_at: string
  sender: Profile | null
}
type Thread = {
  id: string
  subject: string
  status: string
  learner: Profile | null
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function TrainerThreadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: threadData } = await supabase
        .from('academy_support_threads')
        .select('id, subject, status, learner:learner_id(id, first_name, last_name)')
        .eq('id', id)
        .eq('trainer_id', user.id)
        .single()

      if (threadData) setThread(threadData as unknown as Thread)

      const { data: msgs } = await supabase
        .from('academy_support_messages')
        .select('id, role, content, image_url, created_at, sender:sender_id(id, first_name, last_name)')
        .eq('thread_id', id)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs as unknown as Message[])
    }
    load()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() && !file) return
    if (!userId) return
    setIsSubmitting(true)

    let imageUrl: string | null = null
    if (file) {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { data } = await supabase.storage.from('support-images').upload(path, file)
      if (data) imageUrl = supabase.storage.from('support-images').getPublicUrl(data.path).data.publicUrl
    }

    await sendThreadMessage(id, reply.trim(), imageUrl)
    setReply('')
    clearImage()

    // Reload messages
    const supabase = createClient()
    const { data: msgs } = await supabase
      .from('academy_support_messages')
      .select('id, role, content, image_url, created_at, sender:sender_id(id, first_name, last_name)')
      .eq('thread_id', id)
      .order('created_at', { ascending: true })
    if (msgs) setMessages(msgs as unknown as Message[])
    setIsSubmitting(false)
  }

  async function handleResolve() {
    setIsChangingStatus(true)
    await resolveThread(id)
    setThread(prev => prev ? { ...prev, status: 'resolved' } : prev)
    setIsChangingStatus(false)
  }

  async function handleReopen() {
    setIsChangingStatus(true)
    await reopenThread(id)
    setThread(prev => prev ? { ...prev, status: 'open' } : prev)
    setIsChangingStatus(false)
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const learner = thread.learner

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/trainer/support" className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: '#2563eb' }}>
          ← Back to support
        </Link>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            thread.status === 'resolved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {thread.status === 'resolved' ? 'Resolved' : 'Open'}
          </span>
          {thread.status === 'open' ? (
            <button
              onClick={handleResolve}
              disabled={isChangingStatus}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Mark resolved
            </button>
          ) : (
            <button
              onClick={handleReopen}
              disabled={isChangingStatus}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">{thread.subject}</h1>
        {learner && (
          <p className="text-sm text-gray-500 mt-0.5">
            From {learner.first_name} {learner.last_name}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {messages.map(msg => {
            const isTrainer = msg.role === 'trainer'
            const senderName = isTrainer ? 'You (Trainer)' : (learner ? `${learner.first_name} ${learner.last_name}` : 'Learner')
            return (
              <div key={msg.id} className={`px-6 py-5 ${isTrainer ? 'bg-blue-50/40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isTrainer ? 'text-blue-700' : 'text-gray-800'}`}>
                    {senderName}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(msg.created_at)}</span>
                </div>
                {msg.image_url && (
                  <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                    <img src={msg.image_url} alt="Attached" className="rounded-lg max-h-64 object-cover border border-gray-200" />
                  </a>
                )}
                <p className="text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          {previewUrl && (
            <div className="relative inline-block mb-3">
              <img src={previewUrl} alt="Preview" className="h-16 w-auto rounded-lg border border-gray-200" />
              <button type="button" onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center">×</button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2">
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
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
              placeholder="Write a reply… (Enter to send)"
              rows={2}
              disabled={thread.status === 'resolved'}
              className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || (!reply.trim() && !file) || thread.status === 'resolved'}
              className="text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 shrink-0"
              style={{ backgroundColor: '#2563eb' }}
            >
              {isSubmitting ? '…' : 'Send'}
            </button>
          </form>
          {thread.status === 'resolved' && (
            <p className="text-xs text-gray-400 mt-2 text-center">This thread is resolved. Reopen it to reply.</p>
          )}
        </div>
      </div>
    </div>
  )
}
