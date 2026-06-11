'use client'

import { useState, useRef, useTransition } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { addYouTubeVideo, uploadPodcast, deleteResource, updateResourceOrder } from '@/actions/resources'

type Resource = {
  id: string
  title: string
  description: string | null
  type: 'youtube' | 'podcast'
  url: string
  created_at: string
  sort_order: number
}

type ViewStats = { starts: number; completions: number }

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/>
  </svg>
)

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => { await deleteResource(id) })
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500">Delete?</span>
        <button onClick={handleDelete} disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
          {pending ? 'Deleting…' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
      </span>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0">
      Delete
    </button>
  )
}

function ViewBadge({ type, stats, total }: { type: 'youtube' | 'podcast'; stats: ViewStats | undefined; total: number }) {
  if (!stats || stats.starts === 0) return <span className="text-xs text-gray-300">No views yet</span>
  if (type === 'youtube') {
    return (
      <span className="text-xs text-gray-500">
        <span className="font-medium text-gray-700">{stats.starts}</span>
        <span className="text-gray-400">/{total} watched</span>
      </span>
    )
  }
  return (
    <span className="text-xs text-gray-500 flex items-center gap-2">
      <span><span className="font-medium text-gray-700">{stats.starts}</span><span className="text-gray-400">/{total} started</span></span>
      {stats.completions > 0 && <span className="text-green-600 font-medium">{stats.completions} finished</span>}
    </span>
  )
}

function AddVideoForm({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addYouTubeVideo(fd)
      if (res.error) { setError(res.error); return }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Title</label>
        <input name="title" required placeholder="e.g. Introduction to AI" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">YouTube URL</label>
        <input name="url" required placeholder="https://youtube.com/watch?v=…" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea name="description" rows={2} placeholder="Brief summary…" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#2563eb' }}>
          {pending ? 'Adding…' : 'Add video'}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 bg-white border border-gray-200">Cancel</button>
      </div>
    </form>
  )
}

function AddPodcastForm({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await uploadPodcast(fd)
      if (res.error) { setError(res.error); return }
      onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Title</label>
        <input name="title" required placeholder="e.g. Episode 1 — Getting Started" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea name="description" rows={2} placeholder="What this episode covers…" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">MP3 file</label>
        <div onClick={() => fileRef.current?.click()} className="flex items-center gap-3 w-full rounded-md border-2 border-dashed border-gray-300 px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="text-sm text-gray-500">{fileName || 'Click to choose MP3…'}</span>
        </div>
        <input ref={fileRef} name="file" type="file" accept=".mp3,audio/mpeg" required className="sr-only" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
      </div>
      {pending && (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          Uploading… this may take a moment
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#2563eb' }}>
          {pending ? 'Uploading…' : 'Upload podcast'}
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 bg-white border border-gray-200">Cancel</button>
      </div>
    </form>
  )
}

function SortableVideoRow({ resource, viewMap, totalLearners }: { resource: Resource; viewMap: Record<string, ViewStats>; totalLearners: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resource.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const ytId = extractYouTubeId(resource.url)

  return (
    <li ref={setNodeRef} style={style} className="py-3 flex items-center gap-3">
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripIcon />
      </button>
      {ytId && (
        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-20 h-14 object-cover rounded-md shrink-0 bg-gray-100" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{resource.title}</p>
        {resource.description && <p className="text-xs text-gray-400 truncate mt-0.5">{resource.description}</p>}
        <div className="mt-1"><ViewBadge type="youtube" stats={viewMap[resource.id]} total={totalLearners} /></div>
      </div>
      <DeleteButton id={resource.id} />
    </li>
  )
}

function SortablePodcastRow({ resource, viewMap, totalLearners }: { resource: Resource; viewMap: Record<string, ViewStats>; totalLearners: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resource.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <li ref={setNodeRef} style={style} className="py-3 space-y-2">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <GripIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{resource.title}</p>
          {resource.description && <p className="text-xs text-gray-400 truncate">{resource.description}</p>}
          <div className="mt-1"><ViewBadge type="podcast" stats={viewMap[resource.id]} total={totalLearners} /></div>
        </div>
        <DeleteButton id={resource.id} />
      </div>
      <audio controls src={resource.url} className="w-full h-9" style={{ accentColor: '#2563eb' }} />
    </li>
  )
}

export function ResourceManager({ initialResources, viewMap, totalLearners }: {
  initialResources: Resource[]
  viewMap: Record<string, ViewStats>
  totalLearners: number
}) {
  const [videos, setVideos] = useState(initialResources.filter(r => r.type === 'youtube'))
  const [podcasts, setPodcasts] = useState(initialResources.filter(r => r.type === 'podcast'))
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [showAddPodcast, setShowAddPodcast] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleVideoDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = videos.findIndex(v => v.id === active.id)
    const newIdx = videos.findIndex(v => v.id === over.id)
    const reordered = arrayMove(videos, oldIdx, newIdx)
    setVideos(reordered)
    await updateResourceOrder(reordered.map((r, i) => ({ id: r.id, sort_order: i })))
  }

  async function handlePodcastDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = podcasts.findIndex(p => p.id === active.id)
    const newIdx = podcasts.findIndex(p => p.id === over.id)
    const reordered = arrayMove(podcasts, oldIdx, newIdx)
    setPodcasts(reordered)
    await updateResourceOrder(reordered.map((r, i) => ({ id: r.id, sort_order: i })))
  }

  return (
    <div className="space-y-8">
      {/* YouTube Videos */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#dc2626">
                <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
              </svg>
            </div>
            <h2 className="font-heading font-semibold text-gray-800">YouTube Videos</h2>
            {videos.length > 0 && <span className="text-xs text-gray-400">{videos.length}</span>}
          </div>
          {!showAddVideo && (
            <button onClick={() => setShowAddVideo(true)} className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
              + Add video
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {showAddVideo && <AddVideoForm onDone={() => setShowAddVideo(false)} />}
          {videos.length === 0 && !showAddVideo ? (
            <p className="text-sm text-gray-400 py-2">No videos yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleVideoDragEnd}>
              <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-gray-100 mt-2">
                  {videos.map(v => (
                    <SortableVideoRow key={v.id} resource={v} viewMap={viewMap} totalLearners={totalLearners} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>

      {/* Podcasts */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h2 className="font-heading font-semibold text-gray-800">Podcasts</h2>
            {podcasts.length > 0 && <span className="text-xs text-gray-400">{podcasts.length}</span>}
          </div>
          {!showAddPodcast && (
            <button onClick={() => setShowAddPodcast(true)} className="text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
              + Upload podcast
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {showAddPodcast && <AddPodcastForm onDone={() => setShowAddPodcast(false)} />}
          {podcasts.length === 0 && !showAddPodcast ? (
            <p className="text-sm text-gray-400 py-2">No podcasts yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePodcastDragEnd}>
              <SortableContext items={podcasts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-gray-100 mt-2">
                  {podcasts.map(p => (
                    <SortablePodcastRow key={p.id} resource={p} viewMap={viewMap} totalLearners={totalLearners} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>
    </div>
  )
}
