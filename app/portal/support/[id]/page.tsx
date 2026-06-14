import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ThreadReply } from '@/components/support/thread-reply'
import { ThreadAutoRefresh } from '@/components/support/thread-auto-refresh'

type Message = {
  id: string
  role: string
  content: string
  image_url: string | null
  created_at: string
  sender: { first_name: string; last_name: string } | null
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: thread } = await supabase
    .from('academy_support_threads')
    .select('id, subject, status, trainer_id')
    .eq('id', id)
    .eq('learner_id', user!.id)
    .single()

  if (!thread) notFound()

  const { data: messages } = await supabase
    .from('academy_support_messages')
    .select('id, role, content, image_url, created_at, sender:sender_id(first_name, last_name)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true })

  const { data: trainer } = await supabase
    .from('academy_profiles')
    .select('first_name, last_name')
    .eq('id', thread.trainer_id)
    .single()

  return (
    <div className="space-y-5 max-w-2xl">
      {thread.status !== 'resolved' && <ThreadAutoRefresh />}
      <div className="flex items-center justify-between">
        <Link href="/portal/support?tab=trainer" className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: '#2563eb' }}>
          ← Back to support
        </Link>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          thread.status === 'resolved'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {thread.status === 'resolved' ? 'Resolved' : 'Open'}
        </span>
      </div>

      <div>
        <h1 className="font-heading text-xl font-bold text-gray-900">{thread.subject}</h1>
        {trainer && <p className="text-sm text-gray-500 mt-0.5">With {trainer.first_name} {trainer.last_name}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {(messages as unknown as Message[])?.map(msg => {
            const isLearner = msg.role === 'learner'
            const senderName = isLearner ? 'You' : (msg.sender ? `${(msg.sender as { first_name: string; last_name: string }).first_name} ${(msg.sender as { first_name: string; last_name: string }).last_name}` : 'Trainer')
            return (
              <div key={msg.id} className={`px-6 py-5 ${!isLearner ? 'bg-blue-50/40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{senderName}</span>
                  <span className="text-xs text-gray-400">{fmt(msg.created_at)}</span>
                </div>
                {msg.image_url && (
                  <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                    <img src={msg.image_url} alt="Attached" className="rounded-lg max-h-64 object-cover border border-gray-200" />
                  </a>
                )}
                <p className="text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            )
          })}
        </div>

        {thread.status !== 'resolved' && (
          <div className="border-t border-gray-200 px-6 py-4">
            <ThreadReply threadId={id} userId={user!.id} />
          </div>
        )}
      </div>
    </div>
  )
}
