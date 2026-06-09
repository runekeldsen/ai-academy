'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  deleteSection, updateSection, deleteModule, toggleModulePublished,
  updateModuleOrder, setModuleExclusions,
} from '@/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Module = { id: string; title: string; description: string | null; published: boolean; sort_order: number; created_at: string }
type Section = { id: string; title: string; sort_order: number; created_at: string; academy_modules: Module[] }
type Learner = { id: string; first_name: string; last_name: string }

const GripIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/>
  </svg>
)

export function SectionCard({
  section, learners, exclusionMap,
}: {
  section: Section
  learners: Learner[]
  exclusionMap: Record<string, string[]>
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const [saving, setSaving] = useState(false)
  const [modules, setModules] = useState<Module[]>(section.academy_modules ?? [])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  async function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = modules.findIndex(m => m.id === active.id)
    const newIndex = modules.findIndex(m => m.id === over.id)
    const reordered = arrayMove(modules, oldIndex, newIndex)
    setModules(reordered)
    await updateModuleOrder(reordered.map((m, i) => ({ id: m.id, sort_order: i })))
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder section"
        >
          <GripIcon size={16} />
        </button>

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

      {modules.length === 0 ? (
        <div className="px-5 py-4 text-sm text-gray-400">No modules yet.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
          <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-gray-100">
              {modules.map(mod => (
                <ModuleRow
                  key={mod.id}
                  module={mod}
                  learners={learners}
                  excludedLearnerIds={exclusionMap[mod.id] ?? []}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

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

function ModuleRow({
  module, learners, excludedLearnerIds,
}: {
  module: Module
  learners: Learner[]
  excludedLearnerIds: string[]
}) {
  const [published, setPublished] = useState(module.published)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showVisibility, setShowVisibility] = useState(false)
  const [excluded, setExcluded] = useState<Set<string>>(new Set(excludedLearnerIds))
  const [savingVisibility, setSavingVisibility] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

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

  async function handleVisibilitySave() {
    setSavingVisibility(true)
    await setModuleExclusions(module.id, Array.from(excluded))
    setSavingVisibility(false)
    setShowVisibility(false)
  }

  function toggleLearner(learnerId: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(learnerId)) next.delete(learnerId)
      else next.add(learnerId)
      return next
    })
  }

  const hiddenCount = excluded.size

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder"
        >
          <GripIcon />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{module.title}</p>
          {module.description && (
            <p className="text-xs text-gray-400 truncate">{module.description}</p>
          )}
        </div>

        {learners.length > 0 && (
          <button
            onClick={() => setShowVisibility(v => !v)}
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 transition-colors ${
              hiddenCount > 0
                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {hiddenCount > 0 ? `Hidden from ${hiddenCount}` : 'Visible to all'}
          </button>
        )}

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
      </div>

      {showVisibility && learners.length > 0 && (
        <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Show this module to: <span className="text-gray-400 font-normal">(uncheck to hide)</span>
          </p>
          <div className="space-y-1.5">
            {learners.map(learner => (
              <label key={learner.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!excluded.has(learner.id)}
                  onChange={() => toggleLearner(learner.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{learner.first_name} {learner.last_name}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleVisibilitySave}
              disabled={savingVisibility}
              className="text-xs px-3 py-1 rounded font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#2563eb' }}
            >
              {savingVisibility ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setShowVisibility(false); setExcluded(new Set(excludedLearnerIds)) }}
              className="text-xs px-3 py-1 rounded font-medium text-gray-500 bg-white border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
