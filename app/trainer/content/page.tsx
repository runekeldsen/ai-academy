import { createClient } from '@/lib/supabase/server'
import { AddSectionForm } from '@/components/trainer/add-section-form'
import { SectionCard } from '@/components/trainer/section-card'

type Module = { id: string; title: string; description: string | null; published: boolean; created_at: string }
type Section = { id: string; title: string; created_at: string; academy_modules: Module[] }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sections } = await supabase
    .from('academy_sections')
    .select('id, title, created_at, academy_modules(id, title, description, published, created_at)')
    .eq('trainer_id', user!.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Training content</h1>
          <p className="mt-1 text-sm text-gray-500">Organise your learning sections and modules.</p>
        </div>
      </div>

      <div className="space-y-4">
        {(sections as Section[] ?? []).map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>

      <AddSectionForm />
    </div>
  )
}
