'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTest, updateTest } from '@/actions/tests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Module = { id: string; title: string }

interface Props {
  modules: Module[]
  defaultValues?: { id: string; title: string; description: string; moduleId: string; published: boolean }
}

export function TestForm({ modules, defaultValues }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [moduleId, setModuleId] = useState(defaultValues?.moduleId ?? '')
  const [published, setPublished] = useState(defaultValues?.published ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!defaultValues?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isEdit) {
      const res = await updateTest(defaultValues!.id, { title, description, moduleId: moduleId || null, published })
      if (res.error) { setError(res.error); setLoading(false); return }
      setLoading(false)
    } else {
      const res = await createTest({ title, description, moduleId: moduleId || null })
      if (res.error) { setError(res.error); setLoading(false); return }
      router.push(`/trainer/tests/${res.id}/edit`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>}

      <div className="space-y-1.5">
        <Label htmlFor="title">Test title</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Claude basics quiz" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What this test covers" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="module">Linked module (optional)</Label>
        <select
          id="module"
          value={moduleId}
          onChange={e => setModuleId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Published (visible to learners)</span>
        </label>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create & add questions →'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/trainer/tests')}>Cancel</Button>
      </div>
    </form>
  )
}
