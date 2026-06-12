import { createClient } from '@/lib/supabase/server'
import { VideoGrid } from '@/components/portal/video-grid'
import { PodcastPlayer } from '@/components/portal/podcast-player'

type Resource = {
  id: string
  title: string
  description: string | null
  type: 'youtube' | 'podcast'
  url: string
  created_at: string
}

function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default async function PortalResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('trainer_id')
    .eq('id', user!.id)
    .single()

  const { data: resources } = await supabase
    .from('academy_resources')
    .select('id, title, description, type, url, created_at')
    .eq('trainer_id', profile?.trainer_id ?? '')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const all = (resources as Resource[]) ?? []
  const videos = all.filter(r => r.type === 'youtube')
  const podcasts = all.filter(r => r.type === 'podcast')

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Resources</h1>
        <p className="mt-1 text-sm text-gray-500">Videos and podcasts from your trainer.</p>
      </div>

      {all.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-400">No resources yet — check back soon.</p>
        </div>
      )}

      {videos.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#fee2e2' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#dc2626">
                <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.7 12 21.7 12 21.7s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
              </svg>
            </div>
            Videos
          </h2>
          <VideoGrid videos={videos.map(v => ({
            id: v.id,
            title: v.title,
            description: v.description,
            youtubeId: extractYouTubeId(v.url) ?? '',
          }))} />
        </section>
      )}

      {podcasts.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#ede9fe' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            Podcasts
          </h2>
          <div className="space-y-4">
            {podcasts.map(p => (
              <div key={p.id} id={`resource-${p.id}`} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#ede9fe' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-gray-800">{p.title}</h3>
                    {p.description && <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{p.description}</p>}
                  </div>
                </div>
                <PodcastPlayer resourceId={p.id} src={p.url} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
