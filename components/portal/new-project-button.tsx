'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '@/actions/projects'

export function NewProjectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [what, setWhat] = useState('')
  const [howOften, setHowOften] = useState('')
  const [goodResult, setGoodResult] = useState('')
  const [loading, setLoading] = useState(false)

  function composeDescription() {
    const lines: string[] = []
    if (what.trim()) lines.push(`What I want Claude to help with: ${what.trim()}`)
    if (howOften.trim()) lines.push(`How often I'll use it: ${howOften.trim()}`)
    if (goodResult.trim()) lines.push(`A good result looks like: ${goodResult.trim()}`)
    return lines.join('\n')
  }

  async function create(description: string) {
    if (!title.trim()) return
    setLoading(true)
    const res = await createProject(title.trim(), description)
    if (res.id) router.push(`/portal/projects/${res.id}`)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white shrink-0"
        style={{ backgroundColor: '#2563eb' }}
      >
        + New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => !loading && setOpen(false)} />
          <form
            onSubmit={e => { e.preventDefault(); create(composeDescription()) }}
            className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-7 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">Start a new project</h2>
              <p className="mt-1 text-sm text-gray-500">
                A few quick questions help shape your idea — the answers feed straight into your project guide.
                Tip: small ideas ship fastest.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Project title</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Weekly status update helper"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                What should Claude help you with? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={what}
                onChange={e => setWhat(e.target.value)}
                rows={2}
                placeholder="e.g. Writing my weekly status update based on my notes"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                How often will you use it? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={howOften}
                onChange={e => setHowOften(e.target.value)}
                placeholder="e.g. Every Friday"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                What does a good result look like? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={goodResult}
                onChange={e => setGoodResult(e.target.value)}
                rows={2}
                placeholder="e.g. A short, well-structured update I can paste into Teams"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: '#2563eb' }}
              >
                {loading ? 'Creating…' : 'Create project →'}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={loading || !title.trim()}
                  onClick={() => create('')}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  Skip — start blank
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
