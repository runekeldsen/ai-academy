import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'

const baseNavItems = [
  { label: 'Dashboard', href: '/portal' },
  { label: 'Resources', href: '/portal/resources' },
  { label: 'Test your skills', href: '/portal/tests' },
  { label: 'My projects', href: '/portal/projects' },
  { label: 'Support', href: '/portal/support' },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const role = (user.user_metadata?.academy_role as string) ?? 'learner'
  if (role === 'trainer' || role === 'admin') redirect('/trainer')

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name, avatar_url, trainer_id, team_id, projects_read_at, support_read_at, portal_read_at')
    .eq('id', user.id)
    .single()

  // Per-team brand name (falls back to the default in the Sidebar when unset)
  let brand: string | undefined
  if (profile?.team_id) {
    const { data: team } = await supabase
      .from('academy_teams')
      .select('academy_name')
      .eq('id', profile.team_id)
      .single()
    brand = team?.academy_name?.trim() || undefined
  }

  // Notification counts — projects and support in parallel
  const [{ count: projectsBadge }, { count: supportBadge }] = await Promise.all([
    supabase
      .from('academy_projects')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', user.id)
      .not('trainer_responded_at', 'is', null)
      .gt('trainer_responded_at', profile?.projects_read_at ?? '1970-01-01'),
    supabase
      .from('academy_support_threads')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', user.id)
      .not('last_trainer_message_at', 'is', null)
      .gt('last_trainer_message_at', profile?.support_read_at ?? '1970-01-01'),
  ])

  // New modules since last portal visit
  let portalBadge = 0
  if (profile?.trainer_id) {
    const { data: sections } = await supabase
      .from('academy_sections')
      .select('id')
      .eq('trainer_id', profile.trainer_id)
    const ids = (sections ?? []).map((s: { id: string }) => s.id)
    if (ids.length > 0) {
      const { count } = await supabase
        .from('academy_modules')
        .select('id', { count: 'exact', head: true })
        .in('section_id', ids)
        .eq('published', true)
        .gt('created_at', profile.portal_read_at ?? '1970-01-01')
      portalBadge = count ?? 0
    }
  }

  const navItems = baseNavItems.map(item => ({
    ...item,
    badge:
      item.href === '/portal' ? (portalBadge || undefined)
      : item.href === '/portal/projects' ? (projectsBadge || undefined)
      : item.href === '/portal/support' ? (supportBadge || undefined)
      : undefined,
  }))

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        title="Learner Portal"
        brand={brand}
        user={profile ? { firstName: profile.first_name, lastName: profile.last_name, avatarUrl: profile.avatar_url } : undefined}
        profileHref="/portal/profile"
      />
      <main className="flex-1 pt-14 md:pt-0 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
        <div className="p-4 md:p-8 lg:p-10 xl:p-12 w-full max-w-screen-2xl">{children}</div>
      </main>
    </div>
  )
}
