import { createClient } from '@supabase/supabase-js'

// Plain supabase-js client used ONLY to send recovery / login emails.
//
// @supabase/ssr's createBrowserClient hard-forces flowType:'pkce', which makes
// reset links browser-bound (the code-verifier lives in the requesting browser,
// so clicking the link from email — or after a link scanner touches it — fails).
// A plain client in implicit mode sends no PKCE challenge, so the email link
// carries the session tokens in the URL fragment and works in any browser.
// We never persist a session here; the callback hands the fragment tokens to the
// SSR (cookie-based) client via setSession so the rest of the app stays in sync.
export function createRecoveryClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}
