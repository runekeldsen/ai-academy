import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { ModuleContent } from '@/components/portal/module-content'

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
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

  const html = await marked(mod.content ?? '', { breaks: true, renderer })

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

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <ModuleContent html={html} />
      </div>

      <div className="pt-2">
        <Link
          href="/portal"
          className="text-sm font-medium hover:underline flex items-center gap-1"
          style={{ color: '#2563eb' }}
        >
          ← Back to portal
        </Link>
      </div>
    </div>
  )
}
