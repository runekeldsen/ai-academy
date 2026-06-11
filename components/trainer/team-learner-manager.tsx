'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { assignLearnerToTeam } from '@/actions/teams'

type Learner = { id: string; first_name: string; last_name: string; email: string }

export function TeamLearnerManager({ teamId, teamLearners, unassignedLearners }: {
  teamId: string
  teamLearners: Learner[]
  unassignedLearners: Learner[]
}) {
  const router = useRouter()
  const [members, setMembers] = useState<Learner[]>(teamLearners)
  const [available, setAvailable] = useState<Learner[]>(unassignedLearners)
  const [selectedId, setSelectedId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function add() {
    if (!selectedId) return
    setAdding(true); setError('')
    const res = await assignLearnerToTeam(selectedId, teamId)
    setAdding(false)
    if (res.error) { setError(res.error); return }
    const learner = available.find(l => l.id === selectedId)!
    setMembers(prev => [...prev, learner])
    setAvailable(prev => prev.filter(l => l.id !== selectedId))
    setSelectedId('')
    router.refresh()
  }

  async function remove(learnerId: string) {
    setRemoving(learnerId); setError('')
    const res = await assignLearnerToTeam(learnerId, null)
    setRemoving(null)
    if (res.error) { setError(res.error); return }
    const learner = members.find(l => l.id === learnerId)!
    setMembers(prev => prev.filter(l => l.id !== learnerId))
    setAvailable(prev => [...prev, learner].sort((a, b) => a.first_name.localeCompare(b.first_name)))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Current members */}
      {members.length === 0 ? (
        <p className="text-sm text-gray-400">No learners in this team yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
          {members.map(l => (
            <li key={l.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {l.first_name[0]}{l.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{l.first_name} {l.last_name}</p>
                  <p className="text-xs text-gray-400">{l.email}</p>
                </div>
              </div>
              <button
                onClick={() => remove(l.id)}
                disabled={removing === l.id}
                className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {removing === l.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add learner */}
      {available.length > 0 && (
        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Add a learner…</option>
            {available.map(l => (
              <option key={l.id} value={l.id}>
                {l.first_name} {l.last_name} ({l.email})
              </option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={adding || !selectedId}
            className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition-colors shrink-0"
            style={{ backgroundColor: '#2563eb' }}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      )}

      {available.length === 0 && members.length > 0 && (
        <p className="text-xs text-gray-400">
          All learners without a team have been added.{' '}
          <a href="/trainer/learners" className="hover:underline" style={{ color: '#2563eb' }}>
            Manage learners
          </a>
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
