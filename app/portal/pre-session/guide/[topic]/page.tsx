import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { renderModuleContent } from '@/lib/renderModule'
import { ModuleContent } from '@/components/portal/module-content'
import { PrintButton } from '@/components/portal/print-button'
import { TOPICS, TOPIC_GUIDES, type Topic } from '@/lib/topicGuides'

export default async function TopicGuidePage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params
  if (!TOPICS.includes(topic as Topic)) notFound()
  const guide = TOPIC_GUIDES[topic as Topic]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name')
    .eq('id', user!.id)
    .single()

  const learnerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
  const { html } = await renderModuleContent(guide.content)

  return (
    <div className="cheat-sheet max-w-3xl space-y-6">
      <div className="no-print">
        <Link
          href="/portal/pre-session"
          className="text-sm font-medium hover:underline flex items-center gap-1"
          style={{ color: '#2563eb' }}
        >
          ← Back
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live session guide</p>
          <h1 className="font-heading text-2xl font-bold text-gray-900">{guide.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{guide.subtitle}</p>
          {learnerName && <p className="mt-1 text-xs text-gray-400">Prepared for {learnerName}</p>}
        </div>
        <PrintButton />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-none print:p-0 print:rounded-none">
        <ModuleContent html={html} moduleId={`guide-${topic}`} stepCount={0} initialCompletedSteps={[]} />
      </div>

      <p className="text-xs text-gray-400 text-center print:mt-4">Rune&apos;s AI Academy · {guide.title}</p>
    </div>
  )
}
