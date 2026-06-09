import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectEditor } from '@/components/portal/project-editor'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('academy_projects')
    .select('*')
    .eq('id', id)
    .eq('learner_id', user!.id)
    .single()

  if (!project) notFound()

  return (
    <div className="max-w-5xl">
      <ProjectEditor project={project} />
    </div>
  )
}
