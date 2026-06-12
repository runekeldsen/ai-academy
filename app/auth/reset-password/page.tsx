'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stage, setStage] = useState<'verifying' | 'ready' | 'invalid'>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Establish the recovery session from the link before showing the form.
  // token_hash + verifyOtp works in any browser, unlike a PKCE code.
  useEffect(() => {
    const supabase = createClient()

    // Callback redirects here with ?error when a recovery link is expired/used.
    if (searchParams.get('error')) {
      setStage('invalid')
      return
    }

    const tokenHash = searchParams.get('token_hash')
    const type = (searchParams.get('type') ?? 'recovery') as 'recovery' | 'email'

    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
        setStage(error ? 'invalid' : 'ready')
      })
      return
    }

    // No token in the URL — only valid if a recovery session already exists
    // (e.g. the page was refreshed after verifying).
    supabase.auth.getSession().then(({ data }) => {
      setStage(data.session ? 'ready' : 'invalid')
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/auth/login?message=password_updated'), 2000)
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white" style={{ backgroundColor: '#0f172a' }}>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide">Rune's AI Academy</h1>
          <p className="mt-2 text-sm" style={{ color: '#38bdf8' }}>Practical AI Training</p>
        </div>
        <blockquote className="text-xl font-heading font-medium leading-relaxed text-white/90">
          &ldquo;The future belongs to those who learn, unlearn, and relearn.&rdquo;
        </blockquote>
        <p className="text-xs text-white/30">Rune's AI Academy · Invite only</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {stage === 'verifying' ? (
            <p className="text-sm text-gray-400 text-center">Verifying your reset link…</p>
          ) : stage === 'invalid' ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-red-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-gray-800">Reset link expired</h2>
              <p className="text-sm text-gray-500">
                This password reset link is invalid or has already been used. Request a new one to continue.
              </p>
              <Link href="/auth/forgot-password" className="block mt-4 text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
                Request a new reset link →
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dcfce7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-bold text-gray-800">Password updated</h2>
              <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-800">Set new password</h2>
                <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    minLength={8}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  )
}
