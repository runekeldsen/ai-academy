import { InviteForm } from '@/components/trainer/invite-form'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export default async function InvitePage() {
  const headersList = await headers()
  const origin = `${headersList.get('x-forwarded-proto') ?? 'http'}://${headersList.get('host')}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teams } = await supabase
    .from('academy_teams')
    .select('id, name')
    .eq('trainer_id', user!.id)
    .order('name', { ascending: true })

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Invite a learner</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create an account with a first-use password. Send them a login email from the Learners page when ready.
        </p>
      </div>
      <InviteForm origin={origin} teams={teams ?? []} />
    </div>
  )
}
