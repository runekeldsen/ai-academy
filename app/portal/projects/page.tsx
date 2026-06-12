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
  shipped_at: string | null
  created_at: string
  updated_at: string
}

type Template = {
  id: string
  title: string
  description: string
  complexity_score: number
  complexity_label: string
  category: string | null
  recommended_first: boolean
  sort_order: number
  module_id: string | null
}

const complexityColor: Record<string, string> = {
  'Beginner-friendly': 'bg-green-50 text-green-700 border-green-200',
  'Manageable':        'bg-blue-50 text-blue-700 border-blue-200',
  'Challenging':       'bg-amber-50 text-amber-700 border-amber-200',
  'Complex':           'bg-orange-50 text-orange-700 border-orange-200',
  'Very Complex':      'bg-red-50 text-red-700 border-red-200',
}

const categoryMeta: Record<string, { title: string; blurb: string }> = {
  'claude-project': {
    title: 'Create a Claude Project',
    blurb: 'A workspace where Claude remembers your context — set one up for your role or a recurring task.',
  },
  'add-context': {
    title: 'Add your knowledge',
    blurb: 'Give Claude your documents and background so its answers fit your world.',
  },
  'build-skill': {
    title: 'Build a repeatable Skill',
    blurb: 'Turn something you do again and again into a Skill you can reuse with one prompt.',
  },
}
const CATEGORY_ORDER = ['claude-project', 'add-context', 'build-skill']

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FirstProjectBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 shrink-0">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      Great first project
    </span>
  )
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fef9c3' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
          </svg>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {template.recommended_first && <FirstProjectBadge />}
          {template.complexity_label && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${complexityColor[template.complexity_label] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {template.complexity_label}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-heading font-semibold text-gray-800">{template.title}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-3">{template.description}</p>
      </div>

      {template.module_id && (
        <Link
          href={`/portal/modules/${template.module_id}`}
          className="text-xs font-medium hover:underline flex items-center gap-1"
          style={{ color: '#2563eb' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Read the tutorial first
        </Link>
      )}

      <UseTemplateButton title={template.title} description={template.description} />
    </div>
  )
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
      .select('id, title, description, complexity_score, complexity_label, ai_guide, trainer_requested, trainer_feedback, shipped_at, created_at, updated_at')
      .eq('learner_id', user!.id)
      .order('updated_at', { ascending: false }),
    profile?.trainer_id
      ? supabase
          .from('academy_project_templates')
          .select('id, title, description, complexity_score, complexity_label, category, recommended_first, sort_order, module_id')
          .eq('trainer_id', profile.trainer_id)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const list = (projects as Project[]) ?? []
  const inspirationList = (templates as Template[]) ??  []

  const firstPicks = inspirationList.filter(t => t.recommended_first)
  const groups: { key: string; title: string; blurb: string; items: Template[] }[] = []
  for (const key of CATEGORY_ORDER) {
    const items = inspirationList.filter(t => t.category === key)
    if (items.length > 0) groups.push({ key, ...categoryMeta[key], items })
  }
  const uncategorized = inspirationList.filter(t => !t.category || !categoryMeta[t.category])
  if (uncategorized.length > 0) {
    groups.push({ key: 'more', title: 'More ideas', blurb: 'Other project ideas from your trainer.', items: uncategorized })
  }

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

        {/* Philosophy banner */}
        <div className="rounded-xl px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-heading text-lg font-bold">Start small. Get a real win. <span className="whitespace-nowrap">Then grow it.</span></p>
              <p className="mt-1 text-sm" style={{ color: '#bfdbfe' }}>
                The best first project is one you finish this week — not the biggest idea you have.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {CATEGORY_ORDER.map(key => (
                <span key={key} className="text-xs font-medium px-2.5 py-1 rounded-full border border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                  {categoryMeta[key].title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#dbeafe' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-gray-800">Your first project</h2>
                <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                  Pick something small that would genuinely help you — a prompt you&apos;d use every week, a document Claude
                  should know, a task you repeat. Finishing your first project is what builds confidence; you can always
                  grow it afterwards.
                </p>
              </div>
            </div>

            {firstPicks.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Great first projects</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {firstPicks.map(t => <TemplateCard key={t.id} template={t} />)}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Or start with your own idea — use the <span className="font-medium text-gray-700">+ New project</span> button above
              and we&apos;ll help you shape it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(project => {
              const hasGuide = !!project.ai_guide
              const hasFeedback = !!project.trainer_feedback
              const shipped = !!project.shipped_at
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
                    {shipped && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Shipped
                      </span>
                    )}
                    {hasGuide && !shipped && (
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
        <div className="space-y-6">
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

          {groups.map(group => (
            <div key={group.key} className="space-y-3">
              <div>
                <h2 className="font-heading text-base font-semibold text-gray-800">{group.title}</h2>
                <p className="text-sm text-gray-500">{group.blurb}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map(template => <TemplateCard key={template.id} template={template} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
