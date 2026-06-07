'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string | null
}

export function AiChat({ userId, initialMessages }: { userId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  async function uploadImage(f: File): Promise<string> {
    const supabase = createClient()
    const ext = f.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('support-images').upload(path, f)
    if (error) throw new Error(error.message)
    return supabase.storage.from('support-images').getPublicUrl(data.path).data.publicUrl
  }

  async function handleSend() {
    const text = input.trim()
    if (!text && !file) return
    if (isLoading) return

    setIsLoading(true)

    let imageUrl: string | null = null
    try {
      if (file) imageUrl = await uploadImage(file)
    } catch {
      setIsLoading(false)
      return
    }

    const userMsg: Message = { role: 'user', content: text, imageUrl }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    clearImage()
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/support/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, imageUrl }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-heading font-semibold text-gray-700">Ask the AI Assistant</p>
              <p className="text-sm text-gray-400 mt-0.5">Expert in Claude, Skills, Memory, MCP integrations, and prompt engineering</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: '#dbeafe' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 1 8 8c0 5.5-8 13-8 13S4 15.5 4 10a8 8 0 0 1 8-8z"/>
                </svg>
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'text-white rounded-tr-sm'
                : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'
            }`} style={msg.role === 'user' ? { backgroundColor: '#2563eb' } : {}}>
              {msg.imageUrl && (
                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                  <img src={msg.imageUrl} alt="Attached" className="rounded-lg max-h-48 object-cover" />
                </a>
              )}
              {msg.content ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              ) : (
                msg.role === 'assistant' && isLoading && (
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {previewUrl && (
        <div className="px-5 pb-2">
          <div className="relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-16 w-auto rounded-lg border border-gray-200" />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-200 px-4 py-3 flex items-end gap-2">
        <button
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
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Claude, Skills, Memory, integrations… (Enter to send)"
          rows={1}
          className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ minHeight: '38px', maxHeight: '120px' }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && !file)}
          className="text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 shrink-0 transition-opacity"
          style={{ backgroundColor: '#2563eb' }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
