'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPromotion, deletePromotion } from '@/actions/promotions'

type Team = { id: string; name: string }
type Module = { id: string; title: string }
type Resource = { id: string; title: string; type: 'youtube' | 'podcast' }
type Promotion = { id: string; team_id: string; content_type: 'module' | 'resource'; content_id: string; created_at: string }

export function PromotionManager({
  teams,
  modules,
  resources,
  promotions,
}: {
  teams: Team[]
  modules: Module[]
  resources: Resource[]
  promotions: Promotion[]
}) {
  const router = useRouter()
  const [teamId, setTeamId] = useState('')
  const [content, setContent] = useState('') // "module:<id>" | "resource:<id>"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? 'Unknown team'

  function contentLabel(type: 'module' | 'resource', id: string): { label: string; kind: string } {
    if (type === 'module') {
      return { label: modules.find(m => m.id === id)?.title ?? 'Removed module', kind: 'Module' }
    }
    const r = resources.find(x => x.id === id)
    return { label: r?.title ?? 'Removed resource', kind: r?.type === 'podcast' ? 'Podcast' : r?.type === 'youtube' ? 'Video' : 'Resource' }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!teamId) { setError('Pick a team'); return }
    if (!content) { setError('Pick a piece of content'); return }

    const [contentType, contentId] = content.split(':') as ['module' | 'resource', string]
    setLoading(true)
    const res = await createPromotion({ teamId, contentType, contentId })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setContent('')
    router.refresh()
  }

  async function handleRemove(id: string) {
    await deletePromotion(id)
    router.refresh()
  }

  const noContent = modules.length === 0 && resources.length === 0

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
        )}

        {teams.length === 0 ? (
          <p className="text-sm text-gray-500">
            Create a team first, then you can promote content to it.
          </p>
        ) : noContent ? (
          <p className="text-sm text-gray-500">
            Publish a module or add a resource first, then you can promote it.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Team</label>
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Select a team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Content</label>
              <select
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Select content…</option>
                {modules.length > 0 && (
                  <optgroup label="Modules">
                    {modules.map(m => <option key={m.id} value={`module:${m.id}`}>{m.title}</option>)}
                  </optgroup>
                )}
                {resources.length > 0 && (
                  <optgroup label="Resources">
                    {resources.map(r => (
                      <option key={r.id} value={`resource:${r.id}`}>
                        {r.title} ({r.type === 'podcast' ? 'Podcast' : 'Video'})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#2563eb' }}
            >
              {loading ? 'Promoting…' : 'Promote to team'}
            </button>
          </>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold text-gray-500 uppercase tracking-wide">Active promotions</h2>
        {promotions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Nothing promoted yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {promotions.map(p => {
              const { label, kind } = contentLabel(p.content_type, p.content_id)
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{kind}</span>
                      <span className="font-medium text-gray-800 truncate">{label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Pinned to <span className="font-medium text-gray-500">{teamName(p.team_id)}</span></p>
                  </div>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="text-sm font-medium text-gray-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
