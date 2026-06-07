'use client'

import { useState } from 'react'
import { createSection } from '@/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddSectionForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await createSection(title.trim())
    setTitle('')
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
      >
        <span className="text-lg leading-none">+</span> Add section
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Section title, e.g. Learn the basics"
        autoFocus
        required
      />
      <Button type="submit" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
        {loading ? 'Adding…' : 'Add'}
      </Button>
      <Button type="button" variant="outline" onClick={() => { setOpen(false); setTitle('') }}>
        Cancel
      </Button>
    </form>
  )
}
