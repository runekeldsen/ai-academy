import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewProjectButton } from '@/components/portal/new-project-button'

type Project = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  ai_guide: string
  trainer_requested: boolean
  trainer_feedback: string
  created_at: string
  updated_at: string
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

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('academy_projects')
    .select('id, title, description, complexity_score, complexity_label, ai_guide, trainer_requested, trainer_feedback, created_at, updated_at')
    .eq('learner_id', user!.id)
    .order('updated_at', { ascending: false })

  const list = (projects as Project[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">My projects</h1>
          <p className="mt-1 text-sm text-gray-500">Describe an idea, get a step-by-step guide, and track your progress.</p>
        </div>
        <NewProjectButton />
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#dbeafe' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-gray-800">No projects yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add a project idea and get an AI-generated guide on how to build it with Claude.
          </p>
          <NewProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(project => {
            const hasGuide = !!project.ai_guide
            const hasFeedback = !!project.trainer_feedback
            return (
              <Link
                key={project.id}
                href={`/portal/projects/${project.id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold text-gray-800 group-hover:text-blue-600 transition-colors flex-1">{project.title}</h3>
                  {project.complexity_label && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${complexityColor[project.complexity_label] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {project.complexity_label}
                    </span>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-1 flex-wrap">
                  {hasGuide && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Guide ready
                    </span>
                  )}
                  {hasFeedback && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      Trainer responded
                    </span>
                  )}
                  {project.trainer_requested && !hasFeedback && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Awaiting trainer
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{fmt(project.updated_at)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
