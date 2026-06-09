'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/actions/projects'

export function NewProjectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const res = await createProject(title.trim())
    if (res.id) router.push(`/portal/projects/${res.id}`)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white shrink-0"
        style={{ backgroundColor: '#2563eb' }}
      >
        + New project
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Project title…"
        className="rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="px-3 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
        style={{ backgroundColor: '#2563eb' }}
      >
        {loading ? 'Creating…' : 'Create'}
      </button>
      <button type="button" onClick={() => { setOpen(false); setTitle('') }} className="text-sm text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </form>
  )
}
