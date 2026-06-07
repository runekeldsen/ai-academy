'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteLearner } from '@/actions/learners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function InviteForm({ origin }: { origin: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await inviteLearner({ firstName, lastName, email, origin })

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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dcfce7' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="font-heading text-lg font-semibold text-gray-800">Invitation sent!</h2>
        <p className="text-sm text-gray-500">
          <strong>{firstName} {lastName}</strong> will receive an email with a link to activate their account.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button
            onClick={() => { setSuccess(false); setFirstName(''); setLastName(''); setEmail('') }}
            variant="outline"
          >
            Invite another
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
      <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
        {loading ? 'Sending invite…' : 'Send invitation'}
      </Button>
    </form>
  )
}
