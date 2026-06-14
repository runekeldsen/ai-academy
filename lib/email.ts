import { Resend } from 'resend'

const DEFAULT_FROM = "Rune's AI Academy <no-reply@mail.keldsen.org>"

export const EMAIL_FROM = process.env.EMAIL_FROM || DEFAULT_FROM

function client() {
  return new Resend(process.env.RESEND_API_KEY)
}

type Cta = { label: string; href: string }

export function renderEmail({
  heading,
  bodyHtml,
  cta,
}: {
  heading: string
  bodyHtml: string
  cta?: Cta
}): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
         <tr><td style="border-radius:8px;background-color:#2563eb;">
           <a href="${cta.href}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${cta.label}</a>
         </td></tr>
       </table>`
    : ''

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr><td style="background-color:#0f172a;padding:20px 28px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#ffffff;">${heading}</span>
          </td></tr>
          <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
            ${bodyHtml}
            ${button}
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #f1f5f9;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
            ${heading}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<{ error?: string }> {
  if (!process.env.RESEND_API_KEY) return { error: 'Email is not configured' }
  try {
    const { error } = await client().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      replyTo,
    })
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send email' }
  }
}

type Message = { to: string; subject: string; html: string; replyTo?: string }

// Sends in chunks of 100 via Resend's batch endpoint. Returns counts.
export async function sendBatch(messages: Message[]): Promise<{ sent: number; failed: number }> {
  if (!process.env.RESEND_API_KEY || messages.length === 0) {
    return { sent: 0, failed: messages.length }
  }
  const resend = client()
  let sent = 0
  let failed = 0
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100)
    try {
      const { error } = await resend.batch.send(
        chunk.map(m => ({ from: EMAIL_FROM, to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo }))
      )
      if (error) failed += chunk.length
      else sent += chunk.length
    } catch {
      failed += chunk.length
    }
  }
  return { sent, failed }
}
