'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteSection, updateSection, deleteModule, toggleModulePublished } from '@/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Module = { id: string; title: string; description: string | null; published: boolean; created_at: string }
type Section = { id: string; title: string; created_at: string; academy_modules: Module[] }

export function SectionCard({ section }: { section: Section }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const [saving, setSaving] = useState(false)

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await updateSection(section.id, title.trim())
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete section "${section.title}" and all its modules?`)) return
    await deleteSection(section.id)
  }

  const modules: Module[] = section.academy_modules ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        {editing ? (
          <form onSubmit={handleRename} className="flex gap-2 flex-1">
            <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus className="h-7 text-sm" />
            <Button type="submit" size="sm" disabled={saving} style={{ backgroundColor: '#2563eb' }}>Save</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(false); setTitle(section.title) }}>Cancel</Button>
          </form>
        ) : (
          <>
            <h2 className="font-heading font-semibold text-gray-800 flex-1">{section.title}</h2>
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">Rename</button>
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          </>
        )}
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <div className="px-5 py-4 text-sm text-gray-400">No modules yet.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {modules.map(mod => (
            <ModuleRow key={mod.id} module={mod} />
          ))}
        </ul>
      )}

      {/* Add module */}
      <div className="px-5 py-3 border-t border-gray-100">
        <Link
          href={`/trainer/content/modules/new?sectionId=${section.id}`}
          className="text-sm font-medium hover:underline"
          style={{ color: '#2563eb' }}
        >
          + Add module
        </Link>
      </div>
    </div>
  )
}

function ModuleRow({ module }: { module: Module }) {
  const [published, setPublished] = useState(module.published)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const next = !published
    setPublished(next)
    await toggleModulePublished(module.id, next)
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete module "${module.title}"?`)) return
    setDeleting(true)
    await deleteModule(module.id)
  }

  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{module.title}</p>
        {module.description && (
          <p className="text-xs text-gray-400 truncate">{module.description}</p>
        )}
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 transition-colors ${
          published ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {published ? 'Published' : 'Draft'}
      </button>
      <Link
        href={`/trainer/content/modules/${module.id}/edit`}
        className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-400 hover:text-red-600 shrink-0"
      >
        Delete
      </button>
    </li>
  )
}
