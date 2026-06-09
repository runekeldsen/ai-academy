import { createClient } from '@/lib/supabase/server'
import { TrainerProjectFeedback } from '@/components/trainer/trainer-project-feedback'

type Project = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  ai_guide: string
  ai_warnings: string
  trainer_requested: boolean
  trainer_feedback: string
  trainer_responded_at: string | null
  updated_at: string
  academy_profiles: { first_name: string; last_name: string } | null
}

const complexityColor: Record<string, string> = {
  'Beginner-friendly': 'bg-green-50 text-green-700 border-green-200',
  'Manageable':        'bg-blue-50 text-blue-700 border-blue-200',
  'Challenging':       'bg-amber-50 text-amber-700 border-amber-200',
  'Complex':           'bg-orange-50 text-orange-700 border-orange-200',
  'Very Complex':      'bg-red-50 text-red-700 border-red-200',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function TrainerProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('academy_projects')
    .select('id, title, description, complexity_score, complexity_label, ai_guide, ai_warnings, trainer_requested, trainer_feedback, trainer_responded_at, updated_at, academy_profiles!learner_id(first_name, last_name)')
    .eq('trainer_id', user!.id)
    .order('updated_at', { ascending: false })

  const all = (projects as unknown as Project[]) ?? []
  const requesting = all.filter(p => p.trainer_requested && !p.trainer_feedback)
  const rest = all.filter(p => !p.trainer_requested || !!p.trainer_feedback)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Learner projects</h1>
        <p className="mt-1 text-sm text-gray-500">Review project ideas and respond to learners who have asked for your input.</p>
      </div>

      {requesting.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-base font-semibold text-gray-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#d97706' }}>{requesting.length}</span>
            Awaiting your input
          </h2>
          <div className="space-y-4">
            {requesting.map(p => (
              <ProjectCard key={p.id} project={p} showFeedbackForm />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-base font-semibold text-gray-700">All projects</h2>
          <div className="space-y-4">
            {rest.map(p => (
              <ProjectCard key={p.id} project={p} showFeedbackForm={false} />
            ))}
          </div>
        </div>
      )}

      {all.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-500">No learner projects yet.</p>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, showFeedbackForm }: { project: Project; showFeedbackForm: boolean }) {
  const learner = project.academy_profiles
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
        <div>
          <p className="font-heading font-semibold text-gray-800">{project.title}</p>
          {learner && <p className="text-xs text-gray-500 mt-0.5">{learner.first_name} {learner.last_name} · {fmt(project.updated_at)}</p>}
        </div>
        {project.complexity_label && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${complexityColor[project.complexity_label] ?? ''}`}>
            {project.complexity_label} · {project.complexity_score}/10
          </span>
        )}
      </div>

      <div className="px-6 py-4 space-y-4">
        {project.description && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Idea</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {project.ai_guide && (
          <details className="group">
            <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-90 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
              AI guide
            </summary>
            <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap border-l-2 border-gray-100 pl-3">{project.ai_guide}</div>
          </details>
        )}

        {showFeedbackForm ? (
          <TrainerProjectFeedback projectId={project.id} existingFeedback={project.trainer_feedback} />
        ) : project.trainer_feedback ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Your feedback</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{project.trainer_feedback}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
