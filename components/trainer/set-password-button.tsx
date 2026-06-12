'use client'

import { useState } from 'react'
import { setLearnerPassword } from '@/actions/learners'

export function SetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function reset() {
    setPassword(''); setConfirm(''); setShow(false); setError(''); setDone(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const res = await setLearnerPassword(userId, password)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="text-sm font-medium hover:underline"
        style={{ color: '#2563eb' }}
      >
        Set password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 space-y-5">
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">Set password</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose a new password for <span className="font-medium text-gray-700">{name}</span>. Share it with them directly — no email is sent.
              </p>
            </div>

            {done ? (
              <div className="space-y-4">
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-md">
                  Password updated. The learner can now sign in with it.
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">New password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat the password"
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500 select-none">
                  <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />
                  Show password
                </label>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {loading ? 'Saving…' : 'Set password'}
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
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
