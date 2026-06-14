import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AiChat } from '@/components/support/ai-chat'
import { NewThreadForm } from '@/components/support/new-thread-form'
import { MarkRead } from '@/components/portal/mark-read'

type Thread = {
  id: string
  subject: string
  status: string
  updated_at: string
  academy_support_messages: { role: string; content: string; created_at: string }[]
}

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: aiMessages } = await supabase
    .from('academy_ai_messages')
    .select('role, content, image_url')
    .eq('learner_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(40)

  const { data: threads } = await supabase
    .from('academy_support_threads')
    .select('id, subject, status, updated_at, academy_support_messages(role, content, created_at)')
    .eq('learner_id', user!.id)
    .order('updated_at', { ascending: false })

  const initialMessages = (aiMessages ?? []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    imageUrl: m.image_url,
  }))

  // Default to the trainer tab when there's an active (unresolved) case; otherwise AI help.
  const hasActiveCase = ((threads as Thread[]) ?? []).some(t => t.status !== 'resolved')
  const tab = tabParam ?? (hasActiveCase ? 'trainer' : 'ai')

  return (
    <div className="space-y-6 max-w-3xl">
      <MarkRead section="support" />
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Support</h1>
        <p className="mt-1 text-sm text-gray-500">Get help from AI or ask your trainer directly.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link
          href="/portal/support?tab=ai"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'ai'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          AI Help
        </Link>
        <Link
          href="/portal/support?tab=trainer"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'trainer'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Ask Trainer
          {((threads as Thread[]) ?? []).filter(t => {
            const msgs = t.academy_support_messages
            const last = msgs[msgs.length - 1]
            return last?.role === 'trainer'
          }).length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>
              {((threads as Thread[]) ?? []).filter(t => {
                const msgs = t.academy_support_messages
                const last = msgs[msgs.length - 1]
                return last?.role === 'trainer'
              }).length}
            </span>
          )}
        </Link>
      </div>

      {tab === 'ai' ? (
        <AiChat userId={user!.id} initialMessages={initialMessages} />
      ) : (
        <div className="space-y-6">
          <NewThreadForm userId={user!.id} />

          {((threads as Thread[]) ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Previous questions</h2>
              <div className="space-y-2">
                {(threads as Thread[]).map(thread => {
                  const msgs = thread.academy_support_messages ?? []
                  const last = msgs[msgs.length - 1]
                  const awaitingReply = last?.role === 'trainer'
                  return (
                    <Link
                      key={thread.id}
                      href={`/portal/support/${thread.id}`}
                      className="card-lift flex items-start justify-between gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm truncate">{thread.subject}</p>
                          {awaitingReply && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
                              New reply
                            </span>
                          )}
                          {thread.status === 'resolved' && (
                            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                              Resolved
                            </span>
                          )}
                        </div>
                        {last && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{last.content}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(thread.updated_at)}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
