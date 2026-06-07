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

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? '/auth/login?error=invalid_link' : next)
      })
      return
    }

    if (tokenHash && type) {
      supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error }) => {
        router.replace(error ? '/auth/login?error=invalid_link' : next)
      })
      return
    }

    // Implicit flow: tokens arrive in the URL fragment, picked up automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')) {
        subscription.unsubscribe()
        router.replace(next)
      }
    })

    return () => subscription.unsubscribe()
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
