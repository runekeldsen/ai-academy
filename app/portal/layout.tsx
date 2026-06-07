import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'

const navItems = [
  { label: 'Dashboard', href: '/portal' },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('role, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'trainer' || profile?.role === 'admin') redirect('/trainer')

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        title="Learner Portal"
        user={profile ? { firstName: profile.first_name, lastName: profile.last_name, avatarUrl: profile.avatar_url } : undefined}
      />
      <main className="flex-1 pt-14 md:pt-0 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
        <div className="p-4 md:p-8 lg:p-10 xl:p-12 w-full max-w-screen-2xl">{children}</div>
      </main>
    </div>
  )
}
