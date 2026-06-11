'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createModule, updateModule } from '@/actions/modules'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  sectionId: string
  moduleId?: string
  moduleOptions?: { id: string; title: string }[]
  defaultValues?: { title: string; description: string; content: string; difficulty: string; durationMinutes: number | null; prerequisiteModuleId?: string | null }
}

export function ModuleForm({ sectionId, moduleId, moduleOptions = [], defaultValues }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [content, setContent] = useState(defaultValues?.content ?? '')
  const [difficulty, setDifficulty] = useState(defaultValues?.difficulty ?? 'Beginner')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(defaultValues?.durationMinutes ?? '')
  const [prerequisiteModuleId, setPrerequisiteModuleId] = useState(defaultValues?.prerequisiteModuleId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('academy-images')
      .upload(filename, file, { contentType: file.type })

    if (uploadError) {
      setError('Image upload failed: ' + uploadError.message)
      setUploading(false)
      e.target.value = ''
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('academy-images').getPublicUrl(filename)
    const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const markdown = `![${altText}](${publicUrl})`

    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = content.slice(0, start)
      const after = content.slice(end)
      const inserted = (before.endsWith('\n') || before === '' ? '' : '\n') + markdown + '\n'
      setContent(before + inserted + after)
      setTimeout(() => {
        const pos = start + inserted.length
        textarea.selectionStart = textarea.selectionEnd = pos
        textarea.focus()
      }, 0)
    } else {
      setContent(prev => prev + '\n' + markdown + '\n')
    }

    setUploading(false)
    e.target.value = ''
  }

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
      prerequisiteModuleId: prerequisiteModuleId || null,
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

      {moduleOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="prerequisite">Prerequisite (optional)</Label>
          <select
            id="prerequisite"
            value={prerequisiteModuleId}
            onChange={e => setPrerequisiteModuleId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {moduleOptions.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Learners get a friendly recommendation to complete this module first — it never blocks them.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Content</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            <span className="text-xs text-gray-400">Inserts at cursor</span>
          </div>
        </div>
        <textarea
          ref={textareaRef}
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
