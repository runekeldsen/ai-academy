import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'

const navItems = [
  { label: 'Dashboard', href: '/trainer' },
  { label: 'Learners', href: '/trainer/learners' },
  { label: 'Teams', href: '/trainer/teams' },
  { label: 'Content', href: '/trainer/content' },
  { label: 'Tests', href: '/trainer/tests' },
  { label: 'Projects', href: '/trainer/projects' },
  { label: 'Resources', href: '/trainer/resources' },
  { label: 'Support', href: '/trainer/support' },
  { label: 'Invite', href: '/trainer/invite' },
]

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const role = (user.user_metadata?.academy_role as string) ?? 'learner'
  if (role !== 'trainer' && role !== 'admin') redirect('/portal')

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        title="Trainer Portal"
        user={profile ? { firstName: profile.first_name, lastName: profile.last_name, avatarUrl: profile.avatar_url } : undefined}
        profileHref="/trainer/profile"
      />
      <main className="flex-1 pt-14 md:pt-0 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
        <div className="p-4 md:p-8 lg:p-10 xl:p-12 w-full max-w-screen-2xl">{children}</div>
      </main>
    </div>
  )
}
