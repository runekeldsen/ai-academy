'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLearner } from '@/actions/learners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Team = { id: string; name: string }

export function InviteForm({ origin, teams }: { origin: string; teams: Team[] }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamId, setTeamId] = useState('')
  const [sendWelcome, setSendWelcome] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')

    const result = await createLearner({ firstName, lastName, email, password, teamId: teamId || null, sendWelcome })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#dcfce7' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-heading font-semibold text-gray-800">{firstName} {lastName} created</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First-use credentials</p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {email}</p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Password:</span>{' '}
                {showPassword ? password : '••••••••'}
                <button
                  onClick={() => setShowPassword(v => !v)}
                  className="ml-2 text-xs underline"
                  style={{ color: '#2563eb' }}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {sendWelcome
              ? 'A welcome email with a “set your password” link has been sent to the learner. These credentials work as a fallback if you need to share them manually.'
              : 'Share these credentials with the learner. You can also send them a login email from the Learners page when ready.'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => { setSuccess(false); setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setTeamId(''); setSendWelcome(true); setShowPassword(false) }}
            variant="outline"
          >
            Add another
          </Button>
          <Button
            onClick={() => router.push('/trainer/learners')}
            style={{ backgroundColor: '#2563eb' }}
          >
            View learners
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            autoFocus
            placeholder="Jane"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
            placeholder="Smith"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="jane@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">First-use password</Label>
        <Input
          id="password"
          type="text"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <p className="text-xs text-gray-400">Share this with the learner so they can log in immediately. They can change it later.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="team">Team <span className="text-gray-400 font-normal">(optional)</span></Label>
        <select
          id="team"
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">No team</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">Assign the learner to a team now, or leave as &ldquo;No team&rdquo; and set it later.</p>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={sendWelcome}
          onChange={e => setSendWelcome(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          Email a “set your password” link to the learner
          <span className="block text-xs text-gray-400">Sends a welcome email with a secure link so they can set their own password.</span>
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
        {loading ? 'Creating…' : 'Create learner'}
      </Button>
    </form>
  )
}
