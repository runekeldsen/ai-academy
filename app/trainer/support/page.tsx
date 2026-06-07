import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Thread = {
  id: string
  subject: string
  status: string
  updated_at: string
  learner: { first_name: string; last_name: string } | null
  academy_support_messages: { role: string; content: string }[]
}

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function TrainerSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'open' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: threads } = await supabase
    .from('academy_support_threads')
    .select('id, subject, status, updated_at, learner:learner_id(first_name, last_name), academy_support_messages(role, content)')
    .eq('trainer_id', user!.id)
    .eq('status', status)
    .order('updated_at', { ascending: false })

  const allThreads = (threads as unknown as Thread[]) ?? []
  const needsReply = allThreads.filter(t => {
    const msgs = t.academy_support_messages ?? []
    const last = msgs[msgs.length - 1]
    return last?.role === 'learner'
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Support</h1>
          <p className="mt-1 text-sm text-gray-500">Questions from your learners.</p>
        </div>
        {needsReply.length > 0 && (
          <span className="text-sm font-medium px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#2563eb' }}>
            {needsReply.length} awaiting reply
          </span>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 border-b border-gray-200">
        <Link
          href="/trainer/support?status=open"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            status === 'open'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Open
        </Link>
        <Link
          href="/trainer/support?status=resolved"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            status === 'resolved'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Resolved
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {allThreads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              {status === 'open' ? 'No open support questions.' : 'No resolved questions yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allThreads.map(thread => {
              const msgs = thread.academy_support_messages ?? []
              const last = msgs[msgs.length - 1]
              const needsReply = last?.role === 'learner'
              const learner = thread.learner as { first_name: string; last_name: string } | null
              return (
                <Link
                  key={thread.id}
                  href={`/trainer/support/${thread.id}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {learner ? `${learner.first_name[0]}${learner.last_name[0]}` : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {learner ? `${learner.first_name} ${learner.last_name}` : 'Learner'}
                      </span>
                      {needsReply && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#2563eb' }}>
                          Needs reply
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5 truncate">{thread.subject}</p>
                    {last && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{last.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(thread.updated_at)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
