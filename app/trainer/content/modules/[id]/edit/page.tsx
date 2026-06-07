import { createClient } from '@/lib/supabase/server'
import { ModuleForm } from '@/components/trainer/module-form'
import { notFound } from 'next/navigation'

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mod } = await supabase
    .from('academy_modules')
    .select('id, section_id, title, description, content, published, difficulty, duration_minutes')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!mod) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Edit module</h1>
        <p className="mt-1 text-sm text-gray-500">Update the content for this training module.</p>
      </div>
      <ModuleForm
        moduleId={mod.id}
        sectionId={mod.section_id}
        defaultValues={{
          title: mod.title,
          description: mod.description ?? '',
          content: mod.content ?? '',
          difficulty: mod.difficulty ?? 'Beginner',
          durationMinutes: mod.duration_minutes ?? null,
        }}
      />
    </div>
  )
}
