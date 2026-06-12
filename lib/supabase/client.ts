import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Implicit flow so recovery/magic links carry their tokens in the URL
    // fragment and work in any browser (PKCE binds the link to the requesting
    // browser, which breaks "open the email on my phone" password resets).
    { auth: { flowType: 'implicit' } },
  )
}
