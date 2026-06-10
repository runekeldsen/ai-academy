import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/shared/profile-form'

export default async function PortalProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">My profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your name and password.</p>
      </div>
      <ProfileForm
        firstName={profile?.first_name ?? ''}
        lastName={profile?.last_name ?? ''}
      />
    </div>
  )
}
