import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectEditor } from '@/components/portal/project-editor'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: project }, { count: projectCount }, { count: otherShippedCount }] = await Promise.all([
    supabase
      .from('academy_projects')
      .select('*')
      .eq('id', id)
      .eq('learner_id', user!.id)
      .single(),
    supabase
      .from('academy_projects')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', user!.id),
    supabase
      .from('academy_projects')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', user!.id)
      .not('shipped_at', 'is', null)
      .neq('id', id),
  ])

  if (!project) notFound()

  return (
    <div className="max-w-5xl">
      <ProjectEditor
        project={project}
        isFirstProject={(projectCount ?? 1) <= 1}
        isFirstShip={(otherShippedCount ?? 0) === 0}
      />
    </div>
  )
}
