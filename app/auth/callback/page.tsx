'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/'
    const supabase = createClient()

    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'invite' | 'recovery' | 'email' | null

    // On failure, recovery links go back to the reset page (which shows a clear
    // "link expired, request a new one" message) rather than /auth/login — where
    // an already-logged-in user would be silently bounced to their portal.
    const isRecovery = next.startsWith('/auth/reset-password') || type === 'recovery'
    const failDest = isRecovery ? '/auth/reset-password?error=invalid_link' : '/auth/login?error=invalid_link'

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? failDest : next)
      })
      return
    }

    if (tokenHash && type) {
      supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error }) => {
        router.replace(error ? failDest : next)
      })
      return
    }

    // Implicit flow: tokens arrive in the URL fragment. The @supabase/ssr client
    // is PKCE-oriented and won't auto-parse it, so establish the session manually.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        router.replace(error ? failDest : next)
      })
      return
    }

    router.replace(failDest)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <p className="text-sm text-gray-400">Signing you in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
