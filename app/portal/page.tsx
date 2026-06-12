import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { MarkRead } from '@/components/portal/mark-read'
import { WelcomeDialog } from '@/components/portal/welcome-dialog'
import { ContinueHero } from '@/components/portal/continue-hero'
import { SectionProgress } from '@/components/portal/section-progress'
import { getJourney, getContinueModule, isPrereqUnmet, isNewModule } from '@/lib/journey'
import { getMotivation } from '@/lib/achievements'
import { GrowthCard } from '@/components/portal/achievement-badges'
import { PromotionBanner } from '@/components/portal/promotion-banner'

const difficultyStyle: Record<string, string> = {
  Beginner:     'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced:     'bg-red-50 text-red-700 border-red-200',
}

export default async function LearnerPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('academy_profiles')
    .select('first_name, trainer_id, team_id, welcomed_at, academy_teams(name, welcome_message)')
    .eq('id', user!.id)
    .single()

  const teamRaw = profile?.academy_teams
  const team = (Array.isArray(teamRaw) ? teamRaw[0] : teamRaw) as { name: string; welcome_message: string } | null ?? null

  const journey = await getJourney(supabase, user!.id, {
    trainerId: profile?.trainer_id ?? null,
    teamId: profile?.team_id ?? null,
  })

  const motivation = await getMotivation(supabase, user!.id, journey)

  const totalModules = journey.orderedModules.length
  const totalCompleted = journey.orderedModules.filter(m => journey.progressMap.get(m.id)?.completed_at).length
  const continueModule = getContinueModule(journey)

  const showWelcome = !profile?.welcomed_at

  // Pinned promotions for this learner's team (hidden once opened/dismissed)
  type Promo = {
    id: string
    kind: 'Module' | 'Podcast' | 'Video'
    title: string
    description?: string | null
    href?: string
    resourceId?: string
    src?: string
    youtubeId?: string
  }
  let promotions: Promo[] = []
  if (profile?.team_id) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: promos } = await admin
      .from('academy_promotions')
      .select('id, content_type, content_id, created_at')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })

    if (promos && promos.length > 0) {
      const { data: dismissed } = await admin
        .from('academy_promotion_dismissals')
        .select('promotion_id')
        .eq('learner_id', user!.id)
        .in('promotion_id', promos.map(p => p.id))
      const dismissedIds = new Set((dismissed ?? []).map(d => d.promotion_id))
      const active = promos.filter(p => !dismissedIds.has(p.id))

      const moduleIds = active.filter(p => p.content_type === 'module').map(p => p.content_id)
      const resourceIds = active.filter(p => p.content_type === 'resource').map(p => p.content_id)

      const [{ data: mods }, { data: res }] = await Promise.all([
        moduleIds.length
          ? supabase.from('academy_modules').select('id, title, published').in('id', moduleIds)
          : Promise.resolve({ data: [] as { id: string; title: string; published: boolean }[] }),
        resourceIds.length
          ? supabase.from('academy_resources').select('id, title, description, type, url').in('id', resourceIds)
          : Promise.resolve({ data: [] as { id: string; title: string; description: string | null; type: string; url: string }[] }),
      ])
      const modMap = new Map((mods ?? []).map(m => [m.id, m]))
      const resMap = new Map((res ?? []).map(r => [r.id, r]))

      const ytId = (url: string) => url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? null

      promotions = active.flatMap<Promo>(p => {
        if (p.content_type === 'module') {
          const m = modMap.get(p.content_id)
          if (!m || !m.published) return []
          return [{ id: p.id, kind: 'Module', title: m.title, href: `/portal/modules/${m.id}` }]
        }
        const r = resMap.get(p.content_id)
        if (!r) return []
        if (r.type === 'podcast') {
          return [{ id: p.id, kind: 'Podcast', title: r.title, description: r.description, resourceId: r.id, src: r.url }]
        }
        return [{ id: p.id, kind: 'Video', title: r.title, description: r.description, resourceId: r.id, youtubeId: ytId(r.url) ?? '' }]
      })
    }
  }

  return (
    <div className="space-y-10">
      <MarkRead section="portal" />
      {showWelcome && (
        <WelcomeDialog
          firstName={profile?.first_name ?? 'there'}
          teamName={team?.name}
          teamWelcomeMessage={team?.welcome_message}
        />
      )}
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">
          Welcome, {profile?.first_name ?? 'Learner'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your AI Academy training programme.</p>
      </div>

      {team?.welcome_message && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800 whitespace-pre-line">
          {team.welcome_message}
        </div>
      )}

      <PromotionBanner promotions={promotions} />

      <ContinueHero
        module={continueModule}
        completed={totalCompleted}
        total={totalModules}
        isNew={continueModule ? isNewModule(journey, continueModule) : false}
      />

      {totalModules > 0 && <GrowthCard motivation={motivation} />}

      {journey.sections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#dbeafe' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-gray-800">Your training starts here</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your trainer will publish modules here for you to work through.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {journey.sections.map(section => {
            const total = section.modules.length
            const completed = section.modules.filter(m => journey.progressMap.get(m.id)?.completed_at).length
            const sectionDone = motivation.trophiedSectionIds.has(section.id)
            const newCount = section.modules.filter(m => isNewModule(journey, m)).length
            return (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold text-gray-800">{section.title}</h2>
                    {sectionDone && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
                          <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                          <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
                        </svg>
                        Section complete
                      </span>
                    )}
                    {newCount > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                        {newCount} new {newCount === 1 ? 'module' : 'modules'} ✨
                      </span>
                    )}
                  </div>
                  <SectionProgress completed={completed} total={total} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.modules.map(mod => {
                    const p = journey.progressMap.get(mod.id)
                    const isCompleted = !!p?.completed_at
                    const isStarted = !!p?.started_at && !isCompleted
                    const isNew = isNewModule(journey, mod)
                    const unmetPrereq = isPrereqUnmet(journey, mod)

                    return (
                      <Link
                        key={mod.id}
                        href={`/portal/modules/${mod.id}`}
                        className={`group bg-white rounded-xl border p-5 hover:shadow-sm transition-all flex flex-col gap-3 ${
                          isCompleted
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: isCompleted ? '#dcfce7' : '#dbeafe' }}
                          >
                            {isCompleted ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isNew && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                New ✨
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                Completed
                              </span>
                            )}
                            {isStarted && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                In progress
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className={`font-heading font-semibold transition-colors ${
                            isCompleted ? 'text-gray-700' : 'text-gray-800 group-hover:text-blue-600'
                          }`}>
                            {mod.title}
                          </h3>
                          {mod.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{mod.description}</p>
                          )}
                          {unmetPrereq && !isCompleted && (
                            <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                              </svg>
                              Builds on: {unmetPrereq.title}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {mod.difficulty && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[mod.difficulty] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {mod.difficulty}
                              </span>
                            )}
                            {mod.duration_minutes && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {mod.duration_minutes} min
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium flex items-center gap-1 ${isCompleted ? 'text-gray-400' : ''}`} style={isCompleted ? {} : { color: '#2563eb' }}>
                            {isCompleted ? 'Review' : 'Start'} <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
