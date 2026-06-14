'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, updatePassword, updateAvatar } from '@/actions/profile'

type Msg = { ok: boolean; text: string }

export function ProfileForm({
  firstName,
  lastName,
  userId,
  avatarUrl,
}: {
  firstName: string
  lastName: string
  userId: string
  avatarUrl: string | null
}) {
  const router = useRouter()
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<Msg | null>(null)

  const [avatar, setAvatar] = useState(avatarUrl)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<Msg | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ ok: false, text: 'Please choose an image file' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ ok: false, text: 'Image must be under 5 MB' })
      return
    }
    setAvatarBusy(true)
    setAvatarMsg(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${userId}/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('support-images').upload(path, file, { upsert: true })
      if (error || !data) throw error ?? new Error('Upload failed')
      const publicUrl = supabase.storage.from('support-images').getPublicUrl(data.path).data.publicUrl
      const res = await updateAvatar(publicUrl)
      if (res.error) throw new Error(res.error)
      setAvatar(publicUrl)
      setAvatarMsg({ ok: true, text: 'Photo updated' })
      router.refresh()
    } catch (err) {
      setAvatarMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not upload photo' })
    } finally {
      setAvatarBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true)
    setAvatarMsg(null)
    const res = await updateAvatar(null)
    setAvatarBusy(false)
    if (res.error) {
      setAvatarMsg({ ok: false, text: res.error })
      return
    }
    setAvatar(null)
    setAvatarMsg({ ok: true, text: 'Photo removed' })
    router.refresh()
  }

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
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-heading font-semibold text-gray-800">Profile photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#2563eb' }}>
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#2563eb' }}
              >
                {avatarBusy ? 'Uploading…' : avatar ? 'Change photo' : 'Upload photo'}
              </button>
              {avatar && !avatarBusy && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">JPG, PNG or GIF, up to 5 MB.</p>
            {avatarMsg && (
              <p className={`text-sm ${avatarMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{avatarMsg.text}</p>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

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
