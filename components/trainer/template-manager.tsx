'use client'

import { useState, useTransition } from 'react'
import { createTemplate, updateTemplate, deleteTemplate, type TemplateInput } from '@/actions/templates'

export type TemplateRow = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  category: string | null
  recommended_first: boolean
  sort_order: number
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'claude-project', label: 'Create a Claude Project' },
  { value: 'add-context',    label: 'Add your knowledge' },
  { value: 'build-skill',    label: 'Build a repeatable Skill' },
  { value: '',               label: 'Uncategorized (More ideas)' },
]

const COMPLEXITY_LABELS = ['Beginner-friendly', 'Manageable', 'Challenging', 'Complex', 'Very Complex']

const complexityColor: Record<string, string> = {
  'Beginner-friendly': 'bg-green-50 text-green-700 border-green-200',
  'Manageable':        'bg-blue-50 text-blue-700 border-blue-200',
  'Challenging':       'bg-amber-50 text-amber-700 border-amber-200',
  'Complex':           'bg-orange-50 text-orange-700 border-orange-200',
  'Very Complex':      'bg-red-50 text-red-700 border-red-200',
}

function categoryLabel(value: string | null) {
  return CATEGORIES.find(c => c.value === (value ?? ''))?.label ?? 'Uncategorized (More ideas)'
}

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  initial?: TemplateRow
  onSubmit: (data: TemplateInput) => void
  onCancel: () => void
  pending: boolean
  error: string
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [score, setScore] = useState(initial?.complexity_score ?? 2)
  const [label, setLabel] = useState(initial?.complexity_label ?? 'Beginner-friendly')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [recommendedFirst, setRecommendedFirst] = useState(initial?.recommended_first ?? false)
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSubmit({
          title: title.trim(),
          description: description.trim(),
          complexityScore: score,
          complexityLabel: label,
          category: category || null,
          recommendedFirst,
          sortOrder,
        })
      }}
      className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. A Project for your role" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required placeholder="What the learner will build and why it's useful…" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Theme</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Complexity label</label>
          <select value={label} onChange={e => setLabel(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {COMPLEXITY_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Complexity score (1–10)</label>
          <input type="number" min={1} max={10} value={score} onChange={e => setScore(Number(e.target.value))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Sort order</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={recommendedFirst} onChange={e => setRecommendedFirst(e.target.checked)} className="rounded border-gray-300" style={{ accentColor: '#16a34a' }} />
        Mark as <span className="font-medium text-green-700">great first project</span>
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#2563eb' }}>
          {pending ? 'Saving…' : initial ? 'Save changes' : 'Add template'}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 bg-white border border-gray-200">Cancel</button>
      </div>
    </form>
  )
}

function TemplateItem({ template }: { template: TemplateRow }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleUpdate(data: TemplateInput) {
    setError('')
    startTransition(async () => {
      const res = await updateTemplate(template.id, data)
      if (res.error) { setError(res.error); return }
      setEditing(false)
    })
  }

  function handleDelete() {
    startTransition(async () => { await deleteTemplate(template.id) })
  }

  if (editing) {
    return <li className="py-3"><TemplateForm initial={template} onSubmit={handleUpdate} onCancel={() => setEditing(false)} pending={pending} error={error} /></li>
  }

  return (
    <li className="py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800">{template.title}</p>
          {template.recommended_first && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Great first project</span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${complexityColor[template.complexity_label] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {template.complexity_label}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{template.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">{categoryLabel(template.category)} · sort {template.sort_order}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 pt-0.5">
        <button onClick={() => setEditing(true)} className="text-xs font-medium hover:underline" style={{ color: '#2563eb' }}>Edit</button>
        {confirming ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Delete?</span>
            <button onClick={handleDelete} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">{pending ? 'Deleting…' : 'Yes'}</button>
            <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
        )}
      </div>
    </li>
  )
}

export function TemplateManager({ initialTemplates }: { initialTemplates: TemplateRow[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleCreate(data: TemplateInput) {
    setError('')
    startTransition(async () => {
      const res = await createTemplate(data)
      if (res.error) { setError(res.error); return }
      setShowAdd(false)
    })
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#fef9c3' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-gray-800">Inspiration templates</h2>
          {initialTemplates.length > 0 && <span className="text-xs text-gray-400">{initialTemplates.length}</span>}
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
            + Add template
          </button>
        )}
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-gray-400 mb-2">
          These appear in the learners&apos; Inspiration section, grouped by theme. Templates marked
          &quot;great first project&quot; are highlighted to learners who haven&apos;t started yet.
        </p>
        {showAdd && <TemplateForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} pending={pending} error={error} />}
        {initialTemplates.length === 0 && !showAdd ? (
          <p className="text-sm text-gray-400 py-2">No templates yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 mt-2">
            {initialTemplates.map(t => <TemplateItem key={t.id} template={t} />)}
          </ul>
        )}
      </div>
    </section>
  )
}
