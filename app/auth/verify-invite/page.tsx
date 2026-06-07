'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function VerifyInvite() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = (searchParams.get('type') ?? 'invite') as 'invite' | 'recovery' | 'email'

    if (!token_hash) {
      setErrorMsg('No invite token found in this link.')
      setStatus('error')
      return
    }

    const supabase = createClient()
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
      } else {
        router.replace('/auth/accept-invite')
      }
    })
  }, [])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#f8fafc' }}>
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-red-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-gray-800">Invite link expired</h2>
          <p className="text-sm text-gray-500">
            {errorMsg || 'This invite link has already been used or has expired.'}
          </p>
          <p className="text-sm text-gray-500">
            Ask your trainer to send a new invitation, then click the link in that email.
          </p>
          <Link href="/auth/login" className="block mt-4 text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">Setting up your account…</p>
      </div>
    </div>
  )
}

export default function VerifyInvitePage() {
  return (
    <Suspense>
      <VerifyInvite />
    </Suspense>
  )
}
