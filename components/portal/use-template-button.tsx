'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/actions/projects'

export function UseTemplateButton({ title, description }: { title: string; description: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    const { id } = await createProject(title, description)
    if (id) router.push(`/portal/projects/${id}`)
    else setLoading(false)
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="mt-auto w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 border border-blue-200 hover:bg-blue-50"
      style={{ color: '#2563eb' }}
    >
      {loading ? 'Creating…' : 'Use this idea →'}
    </button>
  )
}
