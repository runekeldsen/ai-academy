'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setSent(true)
    setLoading(false)
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dcfce7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-bold text-gray-800">Check your email</h2>
              <p className="text-sm text-gray-500">
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <Link href="/auth/login" className="block mt-6 text-sm font-medium hover:underline" style={{ color: '#2563eb' }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-800">Forgot your password?</h2>
                <p className="mt-1 text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} style={{ backgroundColor: '#2563eb' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
              <p className="mt-6 text-sm text-center text-gray-500">
                <Link href="/auth/login" className="font-medium hover:underline" style={{ color: '#2563eb' }}>
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
