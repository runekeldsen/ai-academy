'use server'

import { Resend } from 'resend'

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })
  if (error) return { error: error.message }

  const origin = process.env.NEXT_PUBLIC_SITE_URL!
  const link = `${origin}/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery&next=/auth/reset-password`

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const { error: emailError } = await resend.emails.send({
    from: 'AI Academy <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your AI Academy password',
    html: `
      <p>Hi,</p>
      <p>Click the link below to reset your AI Academy password. This link expires in 1 hour.</p>
      <p><a href="${link}" style="color:#2563eb">Reset password →</a></p>
      <p style="color:#9ca3af;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    `,
  })
  if (emailError) return { error: String(emailError) }

  return {}
}
