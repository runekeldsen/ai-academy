'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    searchParams.get('error') === 'invalid_link'
      ? 'This reset link is invalid or has expired. Please request a new one.'
      : ''
  )
  const passwordUpdated = searchParams.get('message') === 'password_updated'
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-bold text-gray-800">Welcome back</h2>
        <p className="mt-1 text-sm text-gray-500">Sign in to Rune's AI Academy</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-5">
        {passwordUpdated && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-md">
            ✓ Password updated — you can now sign in with your new password.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-md">{error}</div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: '#2563eb' }}>
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-center text-gray-500">
        Don&apos;t have an account? Contact your trainer to receive an invitation.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white" style={{ backgroundColor: '#0f172a' }}>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide">Rune's AI Academy</h1>
          <p className="mt-2 text-sm" style={{ color: '#38bdf8' }}>Practical AI Training</p>
        </div>
        <div>
          <blockquote className="text-xl font-heading font-medium leading-relaxed text-white/90">
            &ldquo;The future belongs to those who learn, unlearn, and relearn.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-white/50 leading-relaxed">
            Hands-on AI training that turns curiosity<br />into capability.
          </p>
        </div>
        <p className="text-xs text-white/30">Rune's AI Academy · Invite only</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
