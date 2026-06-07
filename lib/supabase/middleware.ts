import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl

  // Public routes — skip auth
  if (url.pathname.startsWith('/auth')) {
    if (
      url.pathname === '/auth/reset-password' ||
      url.pathname === '/auth/callback' ||
      url.pathname === '/auth/accept-invite' ||
      url.pathname === '/auth/verify-invite'
    ) {
      return supabaseResponse
    }
    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // Not authenticated — go to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Read role from JWT metadata — avoids a DB round-trip and works before schema cache warms up
  const role = (user.user_metadata?.academy_role as string) ?? 'learner'
  const isTrainerRole = role === 'trainer' || role === 'admin'

  // Role-based routing
  if (url.pathname === '/') {
    return NextResponse.redirect(new URL(isTrainerRole ? '/trainer' : '/portal', request.url))
  }

  if (url.pathname.startsWith('/trainer') && !isTrainerRole) {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  if (url.pathname.startsWith('/portal') && isTrainerRole) {
    return NextResponse.redirect(new URL('/trainer', request.url))
  }

  return supabaseResponse
}
