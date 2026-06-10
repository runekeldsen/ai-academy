import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewProjectButton } from '@/components/portal/new-project-button'
import { MarkRead } from '@/components/portal/mark-read'
import { UseTemplateButton } from '@/components/portal/use-template-button'

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

type Template = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  sort_order: number
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

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
    .eq('id', user!.id)
    .single()

  const [{ data: projects }, { data: templates }] = await Promise.all([
    supabase
      .from('academy_projects')
      .select('id, title, description, complexity_score, complexity_label, ai_guide, trainer_requested, trainer_feedback, created_at, updated_at')
      .eq('learner_id', user!.id)
      .order('updated_at', { ascending: false }),
    profile?.trainer_id
      ? supabase
          .from('academy_project_templates')
          .select('id, title, description, complexity_score, complexity_label, sort_order')
          .eq('trainer_id', profile.trainer_id)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const list = (projects as Project[]) ?? []
  const inspirationList = (templates as Template[]) ?? []

  return (
    <div className="space-y-10">
      <MarkRead section="projects" />

      {/* My projects */}
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
              Add your own idea above, or pick one from the inspiration section below.
            </p>
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

      {/* Inspiration */}
      {inspirationList.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Inspiration</span>
            </div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-sm text-gray-500">Not sure where to start? Pick one of these ideas and make it your own.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspirationList.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fef9c3' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                    </svg>
                  </div>
                  {template.complexity_label && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${complexityColor[template.complexity_label] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {template.complexity_label}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-gray-800">{template.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-3">{template.description}</p>
                </div>

                <UseTemplateButton title={template.title} description={template.description} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
