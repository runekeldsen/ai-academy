import { createClient } from '@/lib/supabase/server'
import { ResourceManager } from '@/components/trainer/resource-manager'

export default async function TrainerResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: resources } = await supabase
    .from('academy_resources')
    .select('id, title, description, type, url, created_at, sort_order')
    .eq('trainer_id', user!.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const resourceIds = (resources ?? []).map(r => r.id)

  // View counts per resource
  const { data: views } = resourceIds.length > 0
    ? await supabase
        .from('academy_resource_views')
        .select('resource_id, completed_at')
        .in('resource_id', resourceIds)
    : { data: [] }

  const viewMap: Record<string, { starts: number; completions: number }> = {}
  for (const v of (views ?? [])) {
    if (!viewMap[v.resource_id]) viewMap[v.resource_id] = { starts: 0, completions: 0 }
    viewMap[v.resource_id].starts++
    if (v.completed_at) viewMap[v.resource_id].completions++
  }

  // Total learner count for this trainer (for context)
  const { count: learnerCount } = await supabase
    .from('academy_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Resources</h1>
        <p className="mt-1 text-sm text-gray-500">Add YouTube videos and podcasts for your learners.</p>
      </div>
      <ResourceManager
        initialResources={(resources ?? []) as Parameters<typeof ResourceManager>[0]['initialResources']}
        viewMap={viewMap}
        totalLearners={learnerCount ?? 0}
      />
    </div>
  )
}
