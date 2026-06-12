import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { PromotionManager } from '@/components/trainer/promotion-manager'

export default async function TrainerPromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: teams }, { data: modules }, { data: resources }, { data: promotions }] = await Promise.all([
    supabase
      .from('academy_teams')
      .select('id, name')
      .eq('trainer_id', user!.id)
      .order('name', { ascending: true }),
    supabase
      .from('academy_modules')
      .select('id, title')
      .eq('trainer_id', user!.id)
      .eq('published', true)
      .order('title', { ascending: true }),
    supabase
      .from('academy_resources')
      .select('id, title, type')
      .eq('trainer_id', user!.id)
      .order('title', { ascending: true }),
    admin
      .from('academy_promotions')
      .select('id, team_id, content_type, content_id, created_at')
      .eq('trainer_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pin a module, video or podcast to a team. It appears at the top of their portal until each learner opens it.
        </p>
      </div>
      <PromotionManager
        teams={teams ?? []}
        modules={modules ?? []}
        resources={(resources ?? []) as { id: string; title: string; type: 'youtube' | 'podcast' }[]}
        promotions={promotions ?? []}
      />
    </div>
  )
}
