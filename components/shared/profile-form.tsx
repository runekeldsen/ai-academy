'use client'

import { useState } from 'react'
import { updateProfile, updatePassword } from '@/actions/profile'

type Msg = { ok: boolean; text: string }

export function ProfileForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<Msg | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<Msg | null>(null)

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    const { error } = await updateProfile(first, last)
    setProfileSaving(false)
    setProfileMsg(error ? { ok: false, text: error } : { ok: true, text: 'Profile updated' })
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: 'New password must be at least 8 characters' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'Passwords do not match' })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    const { error } = await updatePassword(currentPw, newPw)
    setPwSaving(false)
    if (error) {
      setPwMsg({ ok: false, text: error })
    } else {
      setPwMsg({ ok: true, text: 'Password changed' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <form onSubmit={handleProfileSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-heading font-semibold text-gray-800">Profile information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">First name</label>
            <input
              value={first}
              onChange={e => setFirst(e.target.value)}
              required
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Last name</label>
            <input
              value={last}
              onChange={e => setLast(e.target.value)}
              required
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#2563eb' }}
          >
            {profileSaving ? 'Saving…' : 'Save changes'}
          </button>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{profileMsg.text}</p>
          )}
        </div>
      </form>

      <form onSubmit={handlePasswordSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-heading font-semibold text-gray-800">Change password</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Confirm new password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#2563eb' }}
          >
            {pwSaving ? 'Saving…' : 'Change password'}
          </button>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{pwMsg.text}</p>
          )}
        </div>
      </form>
    </div>
  )
}
