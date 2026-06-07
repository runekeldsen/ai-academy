'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createModule, updateModule } from '@/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  sectionId: string
  moduleId?: string
  defaultValues?: { title: string; description: string; content: string; difficulty: string; durationMinutes: number | null }
}

export function ModuleForm({ sectionId, moduleId, defaultValues }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [content, setContent] = useState(defaultValues?.content ?? '')
  const [difficulty, setDifficulty] = useState(defaultValues?.difficulty ?? 'Beginner')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(defaultValues?.durationMinutes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title,
      description,
      content,
      difficulty,
      durationMinutes: durationMinutes === '' ? null : Number(durationMinutes),
    }

    const result = moduleId
      ? await updateModule(moduleId, payload)
      : await createModule({ sectionId, ...payload })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/trainer/content')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Module title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Introduction to prompting"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Short description</Label>
        <Input
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Shown on the card in the learner portal"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={120}
            value={durationMinutes}
            onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Content</Label>
        <textarea
          id="content"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={16}
          placeholder="Write the training content here. Use blank lines to separate paragraphs."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y font-mono"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
          {loading ? 'Saving…' : moduleId ? 'Save changes' : 'Create module'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/trainer/content')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
