import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/shared/profile-form'
import { getJourney } from '@/lib/journey'
import { getMotivation } from '@/lib/achievements'
import { GrowthCard } from '@/components/portal/achievement-badges'
import { NudgeToggle } from '@/components/portal/nudge-toggle'

export default async function PortalProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name, trainer_id, team_id, email_nudges, avatar_url')
    .eq('id', user!.id)
    .single()

  const journey = await getJourney(supabase, user!.id, {
    trainerId: profile?.trainer_id ?? null,
    teamId: profile?.team_id ?? null,
  })
  const motivation = await getMotivation(supabase, user!.id, journey)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">My profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your name and password.</p>
      </div>
      {journey.orderedModules.length > 0 && <GrowthCard motivation={motivation} />}
      <NudgeToggle initialEnabled={profile?.email_nudges !== false} />
      <ProfileForm
        firstName={profile?.first_name ?? ''}
        lastName={profile?.last_name ?? ''}
        userId={user!.id}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  )
}
