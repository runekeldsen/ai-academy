import type { SupabaseClient } from '@supabase/supabase-js'
import { LEVELS, POINTS, type Level } from '@/lib/achievements'

const STALLED_DAYS = 7
const QUIET_DAYS = 14
const STREAK_WINDOW_DAYS = 7
const STREAK_COUNT = 3

export type CohortFlag = 'quiet' | 'stalled' | 'not-started' | 'on-track' | 'streak' | 'up-to-date'

export type LearnerOverview = {
  id: string
  firstName: string
  lastName: string
  completed: number
  total: number
  currentModuleTitle: string | null
  level: Level
  lastActiveAt: string | null
  flag: CohortFlag
}

export type CohortStats = {
  activeThisWeek: number
  completionsThisWeek: number
  avgCompletionPct: number
}

export type ModuleStat = {
  moduleId: string
  title: string
  sectionTitle: string
  startersCount: number
  completersCount: number
  totalLearners: number
}

export type ActivityItem = {
  learnerId: string
  learnerName: string
  moduleTitle: string
  completedAt: string
}

export type CohortResult = {
  learners: LearnerOverview[]
  stats: CohortStats
  moduleStats: ModuleStat[]
  recentActivity: ActivityItem[]
}

type AnswerRecord = { score: number }

const flagPriority: Record<CohortFlag, number> = {
  quiet: 0,
  stalled: 1,
  'not-started': 2,
  'on-track': 3,
  streak: 4,
  'up-to-date': 5,
}

export async function getCohortOverview(
  supabase: SupabaseClient,
  trainerId: string
): Promise<CohortResult> {
  const { data: learners } = await supabase
    .from('academy_profiles')
    .select('id, first_name, last_name, team_id')
    .eq('trainer_id', trainerId)
    .eq('role', 'learner')

  if (!learners?.length) return {
    learners: [],
    stats: { activeThisWeek: 0, completionsThisWeek: 0, avgCompletionPct: 0 },
    moduleStats: [],
    recentActivity: [],
  }
  const learnerIds = learners.map(l => l.id)
  const teamIds = [...new Set(learners.map(l => l.team_id).filter(Boolean))] as string[]

  const [{ data: sections }, { data: progressRows }, { data: exclusions }, { data: teamSectionRows }, { data: attempts }, { data: projects }, { data: levelRows }] =
    await Promise.all([
      supabase
        .from('academy_sections')
        .select('id, title, sort_order, academy_modules(id, title, sort_order, published)')
        .eq('trainer_id', trainerId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('academy_progress')
        .select('learner_id, module_id, started_at, completed_at')
        .in('learner_id', learnerIds),
      supabase
        .from('academy_module_exclusions')
        .select('learner_id, module_id')
        .eq('trainer_id', trainerId),
      teamIds.length
        ? supabase.from('academy_team_sections').select('team_id, section_id').in('team_id', teamIds)
        : Promise.resolve({ data: [] as { team_id: string; section_id: string }[] }),
      supabase
        .from('academy_test_attempts')
        .select('learner_id, started_at, completed_at, answers')
        .in('learner_id', learnerIds),
      supabase
        .from('academy_projects')
        .select('learner_id')
        .in('learner_id', learnerIds),
      supabase
        .from('academy_achievements')
        .select('learner_id, achievement_id')
        .in('learner_id', learnerIds)
        .like('achievement_id', 'level:%'),
    ])

  type RawSection = {
    id: string
    title: string
    sort_order: number | null
    academy_modules: { id: string; title: string; sort_order: number | null; published: boolean }[]
  }
  const orderedSections = (((sections as unknown as RawSection[]) ?? []).map(s => ({
    id: s.id,
    modules: [...(s.academy_modules ?? [])]
      .filter(m => m.published)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  })))

  const teamSectionMap = new Map<string, Set<string>>()
  for (const r of teamSectionRows ?? []) {
    if (!teamSectionMap.has(r.team_id)) teamSectionMap.set(r.team_id, new Set())
    teamSectionMap.get(r.team_id)!.add(r.section_id)
  }
  const exclusionMap = new Map<string, Set<string>>()
  for (const r of exclusions ?? []) {
    if (!exclusionMap.has(r.learner_id)) exclusionMap.set(r.learner_id, new Set())
    exclusionMap.get(r.learner_id)!.add(r.module_id)
  }

  const now = Date.now()
  const daysAgo = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000

  const overviews = learners.map(l => {
    const teamSections = l.team_id ? teamSectionMap.get(l.team_id) : undefined
    const excluded = exclusionMap.get(l.id)
    const visibleModules = orderedSections
      .filter(s => !teamSections?.size || teamSections.has(s.id))
      .flatMap(s => s.modules)
      .filter(m => !excluded?.has(m.id))

    const myProgress = new Map(
      ((progressRows ?? []) as { learner_id: string; module_id: string; started_at: string; completed_at: string | null }[])
        .filter(p => p.learner_id === l.id)
        .map(p => [p.module_id, p])
    )
    const myAttempts = ((attempts ?? []) as { learner_id: string; started_at: string | null; completed_at: string | null; answers: AnswerRecord[] | null }[])
      .filter(a => a.learner_id === l.id)

    const completed = visibleModules.filter(m => myProgress.get(m.id)?.completed_at).length
    const total = visibleModules.length
    const currentModule = visibleModules.find(m => !myProgress.get(m.id)?.completed_at) ?? null

    let lastActiveAt: string | null = null
    for (const p of myProgress.values()) {
      for (const t of [p.started_at, p.completed_at]) {
        if (t && (!lastActiveAt || t > lastActiveAt)) lastActiveAt = t
      }
    }
    for (const a of myAttempts) {
      for (const t of [a.started_at, a.completed_at]) {
        if (t && (!lastActiveAt || t > lastActiveAt)) lastActiveAt = t
      }
    }

    const testsPassed = myAttempts.filter(a => {
      if (!a.completed_at) return false
      const answers = a.answers ?? []
      if (answers.length === 0) return false
      return Math.round(answers.reduce((s, x) => s + (x.score ?? 0), 0) / answers.length) >= 60
    }).length
    const projectCount = (projects ?? []).filter(p => p.learner_id === l.id).length
    const points = completed * POINTS.module + testsPassed * POINTS.test + Math.min(projectCount, 5) * POINTS.project
    const derivedLevel = [...LEVELS].reverse().find(lv => points >= lv.min) ?? LEVELS[0]
    const persistedIdx = LEVELS.reduce(
      (best, lv, i) =>
        (levelRows ?? []).some(r => r.learner_id === l.id && r.achievement_id === `level:${lv.id}`)
          ? Math.max(best, i)
          : best,
      0
    )
    const level = LEVELS[Math.max(LEVELS.indexOf(derivedLevel), persistedIdx)]

    const recentCompletions = [...myProgress.values()].filter(
      p => p.completed_at && daysAgo(p.completed_at) <= STREAK_WINDOW_DAYS
    ).length

    let flag: CohortFlag
    if (total > 0 && completed === total) flag = 'up-to-date'
    else if (recentCompletions >= STREAK_COUNT) flag = 'streak'
    else if (!lastActiveAt) flag = 'not-started'
    else if (daysAgo(lastActiveAt) > QUIET_DAYS) flag = 'quiet'
    else if (currentModule && myProgress.get(currentModule.id)?.started_at && daysAgo(lastActiveAt) > STALLED_DAYS) flag = 'stalled'
    else flag = 'on-track'

    return {
      id: l.id,
      firstName: l.first_name,
      lastName: l.last_name,
      completed,
      total,
      currentModuleTitle: currentModule?.title ?? null,
      level,
      lastActiveAt,
      flag,
    }
  })

  const sortedLearners = overviews.sort((a, b) => {
    const p = flagPriority[a.flag] - flagPriority[b.flag]
    if (p !== 0) return p
    return (a.lastActiveAt ?? '') < (b.lastActiveAt ?? '') ? -1 : 1
  })

  // cohort-level stats
  const activeThisWeek = overviews.filter(l => l.lastActiveAt && daysAgo(l.lastActiveAt) <= 7).length
  const completionsThisWeek = ((progressRows ?? []) as { completed_at: string | null }[])
    .filter(p => p.completed_at && daysAgo(p.completed_at) <= 7).length
  const learnersWithModules = overviews.filter(l => l.total > 0)
  const avgCompletionPct = learnersWithModules.length > 0
    ? Math.round(learnersWithModules.reduce((sum, l) => sum + (l.completed / l.total) * 100, 0) / learnersWithModules.length)
    : 0

  // module-level stats
  const startersByModule = new Map<string, Set<string>>()
  const completersByModule = new Map<string, Set<string>>()
  for (const p of (progressRows ?? []) as { learner_id: string; module_id: string; started_at: string | null; completed_at: string | null }[]) {
    if (p.started_at) {
      if (!startersByModule.has(p.module_id)) startersByModule.set(p.module_id, new Set())
      startersByModule.get(p.module_id)!.add(p.learner_id)
    }
    if (p.completed_at) {
      if (!completersByModule.has(p.module_id)) completersByModule.set(p.module_id, new Set())
      completersByModule.get(p.module_id)!.add(p.learner_id)
    }
  }

  type RawSectionForStats = { id: string; title: string; academy_modules: { id: string; title: string; published: boolean }[] }
  const moduleStats: ModuleStat[] = []
  for (const s of ((sections as unknown as RawSectionForStats[]) ?? [])) {
    for (const m of (s.academy_modules ?? []).filter(m => m.published)) {
      moduleStats.push({
        moduleId: m.id,
        title: m.title,
        sectionTitle: s.title,
        startersCount: startersByModule.get(m.id)?.size ?? 0,
        completersCount: completersByModule.get(m.id)?.size ?? 0,
        totalLearners: learners.length,
      })
    }
  }
  // sort fewest completers first (drop-off focus)
  moduleStats.sort((a, b) => a.completersCount - b.completersCount)

  // recent activity feed
  const learnerNameMap = new Map(learners.map(l => [l.id, `${l.first_name} ${l.last_name}`]))
  const moduleTitleMap = new Map<string, string>()
  for (const s of ((sections as unknown as RawSectionForStats[]) ?? [])) {
    for (const m of s.academy_modules ?? []) moduleTitleMap.set(m.id, m.title)
  }
  const recentActivity: ActivityItem[] = ((progressRows ?? []) as { learner_id: string; module_id: string; completed_at: string | null }[])
    .filter(p => p.completed_at)
    .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1))
    .slice(0, 10)
    .map(p => ({
      learnerId: p.learner_id,
      learnerName: learnerNameMap.get(p.learner_id) ?? 'Learner',
      moduleTitle: moduleTitleMap.get(p.module_id) ?? 'Module',
      completedAt: p.completed_at!,
    }))

  return {
    learners: sortedLearners,
    stats: { activeThisWeek, completionsThisWeek, avgCompletionPct },
    moduleStats,
    recentActivity,
  }
}
