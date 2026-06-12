import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked, type Tokens } from 'marked'
import { ModuleContent } from '@/components/portal/module-content'
import { CompleteButton } from '@/components/portal/complete-button'
import { ModulePager } from '@/components/portal/module-pager'
import { UseTemplateButton } from '@/components/portal/use-template-button'
import { trackModuleOpened } from '@/actions/progress'
import { getJourney, getNextModule, getPrevModule, isPrereqUnmet } from '@/lib/journey'

const STEP_HEADING = /^step\s+\d+/i

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id, team_id')
    .eq('id', user!.id)
    .single()

  const { data: mod } = await supabase
    .from('academy_modules')
    .select('id, title, description, content, section_id, academy_sections(title)')
    .eq('id', id)
    .eq('trainer_id', profile?.trainer_id ?? '')
    .eq('published', true)
    .single()

  if (!mod) notFound()

  await trackModuleOpened(id)

  const { data: linkedTemplate } = await supabase
    .from('academy_project_templates')
    .select('title, description')
    .eq('trainer_id', profile?.trainer_id ?? '')
    .eq('module_id', id)
    .limit(1)
    .maybeSingle()

  const journey = await getJourney(supabase, user!.id, {
    trainerId: profile?.trainer_id ?? null,
    teamId: profile?.team_id ?? null,
  })

  const journeyModule = journey.orderedModules.find(m => m.id === id) ?? null
  const prev = journeyModule ? getPrevModule(journey, id) : null
  const next = journeyModule ? getNextModule(journey, id) : null
  const unmetPrereq = journeyModule ? isPrereqUnmet(journey, journeyModule) : null

  const progress = journey.progressMap.get(id) ?? null
  const isCompleted = !!progress?.completed_at
  const completedSteps = progress?.completed_steps ?? []

  const sectionTitle = (mod.academy_sections as unknown as { title: string } | null)?.title ?? ''

  const renderer = new marked.Renderer()
  renderer.code = ({ text }: { text: string }) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<div class="prompt-block"><textarea class="prompt-textarea" readonly>${escaped}</textarea><button class="copy-btn">Copy prompt</button></div>`
  }

  let stepCounter = 0
  renderer.heading = function (token: Tokens.Heading) {
    const inner = this.parser.parseInline(token.tokens)
    if (token.depth === 2 && STEP_HEADING.test(token.text)) {
      const idx = stepCounter++
      return `<h2 class="step-heading"><button type="button" class="step-check" data-step-index="${idx}" aria-label="Mark step as done"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><span>${inner}</span></h2>\n`
    }
    return `<h${token.depth}>${inner}</h${token.depth}>\n`
  }

  const html = await marked(mod.content ?? '', { breaks: true, renderer })
  const stepCount = stepCounter

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/portal"
          className="text-sm font-medium hover:underline flex items-center gap-1"
          style={{ color: '#2563eb' }}
        >
          ← Back to portal
        </Link>
      </div>

      <div className="space-y-1">
        {sectionTitle && (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{sectionTitle}</p>
        )}
        <h1 className="font-heading text-2xl font-bold text-gray-900">{mod.title}</h1>
        {mod.description && (
          <p className="text-gray-500">{mod.description}</p>
        )}
      </div>

      {unmetPrereq && !isCompleted && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 flex items-start gap-3">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>
            <strong>Tip:</strong> this module builds on{' '}
            <Link href={`/portal/modules/${unmetPrereq.id}`} className="font-semibold underline hover:text-amber-900">
              {unmetPrereq.title}
            </Link>
            {' '}— we recommend completing that one first. You&apos;re welcome to continue here if you prefer.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <ModuleContent
          html={html}
          moduleId={id}
          stepCount={stepCount}
          initialCompletedSteps={completedSteps.filter(s => s < stepCount)}
        />
      </div>

      <div className="flex items-center justify-end pt-2">
        <CompleteButton
          moduleId={id}
          initialCompleted={isCompleted}
          moduleTitle={mod.title}
          nextModule={next ? { id: next.id, title: next.title } : null}
        />
      </div>

      {linkedTemplate && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold text-gray-900">Ready to build your own?</h2>
            <p className="mt-1 text-sm text-gray-600">
              Turn what you just learned into a project — Claude will guide you step by step, and you can ask your trainer for input.
            </p>
          </div>
          <div className="shrink-0 sm:w-56">
            <UseTemplateButton title={linkedTemplate.title} description={linkedTemplate.description} />
          </div>
        </div>
      )}

      <ModulePager prev={prev} next={next} />
    </div>
  )
}
