import { createClient } from '@/lib/supabase/server'
import { AddSectionForm } from '@/components/trainer/add-section-form'
import { SortableSectionList } from '@/components/trainer/sortable-section-list'

type Module = { id: string; title: string; description: string | null; published: boolean; sort_order: number; created_at: string }
type Section = { id: string; title: string; sort_order: number; created_at: string; academy_modules: Module[] }
type Learner = { id: string; first_name: string; last_name: string }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title, sort_order, created_at, academy_modules(id, title, description, published, sort_order, created_at)')
    .eq('trainer_id', user!.id)
    .order('sort_order', { ascending: true })

  const { data: learners } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name')
    .eq('trainer_id', user!.id)
    .eq('role', 'learner')
    .order('first_name', { ascending: true })

  const { data: exclusions } = await supabase
    .from('academy_module_exclusions')
    .select('module_id, learner_id')

  const exclusionMap: Record<string, string[]> = {}
  for (const exc of (exclusions ?? [])) {
    if (!exclusionMap[exc.module_id]) exclusionMap[exc.module_id] = []
    exclusionMap[exc.module_id].push(exc.learner_id)
  }

  const sortedSections = ((sections as Section[]) ?? []).map(s => ({
    ...s,
    academy_modules: [...(s.academy_modules ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Training content</h1>
          <p className="mt-1 text-sm text-gray-500">Organise your learning sections and modules.</p>
        </div>
      </div>

      <SortableSectionList
        sections={sortedSections}
        learners={(learners as Learner[]) ?? []}
        exclusionMap={exclusionMap}
      />

      <AddSectionForm />
    </div>
  )
}
