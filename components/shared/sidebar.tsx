'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type NavItem = { label: string; href: string }
type UserInfo = { firstName: string; lastName: string; avatarUrl: string | null }

export function Sidebar({ items, title, user }: { items: NavItem[]; title: string; user?: UserInfo }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navLinks = items.map(item => {
    const isActive = pathname === item.href || (item.href !== '/trainer' && item.href !== '/portal' && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center px-3 py-2.5 text-sm rounded-md transition-colors font-medium',
          isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
        )}
        style={isActive ? { backgroundColor: '#2563eb' } : undefined}
      >
        {item.label}
      </Link>
    )
  })

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : ''

  const Avatar = user ? (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#2563eb' }}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      )}
    </div>
  ) : null

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-white/10"
        style={{ backgroundColor: '#0f172a' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1 -ml-1"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
            <rect y="3" width="22" height="2.5" rx="1.25" />
            <rect y="9.75" width="22" height="2.5" rx="1.25" />
            <rect y="16.5" width="22" height="2.5" rx="1.25" />
          </svg>
        </button>
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-heading text-white font-bold text-base">Rune's AI Academy</span>
          <span className="text-[11px] mt-0.5" style={{ color: '#38bdf8' }}>{title}</span>
        </Link>
        {user && (
          <div className="ml-auto">
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ backgroundColor: '#2563eb' }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Backdrop */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'flex flex-col w-64 xl:w-72 z-50',
          'fixed inset-y-0 left-0 md:static',
          'h-screen md:min-h-screen shrink-0',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Brand header */}
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="block">
            <span className="font-heading text-white font-bold text-lg tracking-wide">Rune's AI Academy</span>
            <span className="block text-xs mt-0.5" style={{ color: '#38bdf8' }}>{title}</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/50 hover:text-white p-1"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
              <path d="M14.53 4.53a.75.75 0 0 0-1.06-1.06L9 7.94 4.53 3.47a.75.75 0 0 0-1.06 1.06L7.94 9l-4.47 4.47a.75.75 0 1 0 1.06 1.06L9 10.06l4.47 4.47a.75.75 0 0 0 1.06-1.06L10.06 9z"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navLinks}
        </nav>

        {/* User + Sign out */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-md">
              {Avatar}
              <p className="text-sm text-white/70 truncate">{user.firstName} {user.lastName}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-sm text-white/50 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
