import type { SupabaseClient } from '@supabase/supabase-js'
import type { Journey } from '@/lib/journey'

export type Achievement = {
  id: string
  label: string
  hint: string
  earned: boolean
  earnedAt: string | null
}

export type Level = { id: string; label: string; min: number }

export const LEVELS: Level[] = [
  { id: 'explorer',     label: 'Explorer',     min: 0 },
  { id: 'practitioner', label: 'Practitioner', min: 50 },
  { id: 'builder',      label: 'Builder',      min: 120 },
  { id: 'ai-confident', label: 'AI-Confident', min: 200 },
]

export const POINTS = { module: 10, test: 15, project: 20 }

export type Motivation = {
  achievements: Achievement[]
  points: number
  level: Level
  nextLevel: Level | null
  pctToNextLevel: number
  upToDate: boolean
  trophiedSectionIds: Set<string>
}

type AnswerRecord = { score: number }

export async function getMotivation(
  supabase: SupabaseClient,
  learnerId: string,
  journey: Journey
): Promise<Motivation> {
  const [{ data: attempts }, { count: projectCount }, { data: earnedRows }] = await Promise.all([
    supabase
      .from('academy_test_attempts')
      .select('answers')
      .eq('learner_id', learnerId)
      .not('completed_at', 'is', null),
    supabase
      .from('academy_projects')
      .select('id', { count: 'exact', head: true })
      .eq('learner_id', learnerId),
    supabase
      .from('academy_achievements')
      .select('achievement_id, earned_at')
      .eq('learner_id', learnerId),
  ])

  const testsPassed = ((attempts ?? []) as { answers: AnswerRecord[] | null }[]).filter(a => {
    const answers = a.answers ?? []
    if (answers.length === 0) return false
    const score = Math.round(answers.reduce((s, x) => s + (x.score ?? 0), 0) / answers.length)
    return score >= 60
  }).length

  const projects = projectCount ?? 0
  const modulesCompleted = journey.orderedModules.filter(m => journey.progressMap.get(m.id)?.completed_at).length
  const sectionsCompleted = journey.sections.filter(
    s => s.modules.length > 0 && s.modules.every(m => journey.progressMap.get(m.id)?.completed_at)
  ).length
  const upToDate = journey.orderedModules.length > 0 && modulesCompleted === journey.orderedModules.length

  const points = modulesCompleted * POINTS.module + testsPassed * POINTS.test + Math.min(projects, 5) * POINTS.project

  const earnedMap = new Map((earnedRows ?? []).map(r => [r.achievement_id as string, r.earned_at as string]))

  // Levels are earn-once: the displayed level never drops, even if points dip
  const derivedLevel = [...LEVELS].reverse().find(l => points >= l.min) ?? LEVELS[0]
  const persistedLevelIdx = LEVELS.reduce(
    (best, l, i) => (earnedMap.has(`level:${l.id}`) ? Math.max(best, i) : best), 0
  )
  const level = LEVELS[Math.max(LEVELS.indexOf(derivedLevel), persistedLevelIdx)]
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1] ?? null
  const effectivePoints = Math.max(points, level.min)
  const pctToNextLevel = nextLevel
    ? Math.min(100, Math.round(((effectivePoints - level.min) / (nextLevel.min - level.min)) * 100))
    : 100

  const qualifications: { id: string; label: string; hint: string; earned: boolean }[] = [
    { id: 'first-module',  label: 'First module',     hint: 'Complete your first module to earn this.',        earned: modulesCompleted >= 1 },
    { id: 'five-modules',  label: '5 modules',        hint: 'Complete 5 modules to earn this.',                earned: modulesCompleted >= 5 },
    { id: 'ten-modules',   label: '10 modules',       hint: 'Complete 10 modules to earn this.',               earned: modulesCompleted >= 10 },
    { id: 'first-section', label: 'Section complete', hint: 'Complete every module in a section to earn this.', earned: sectionsCompleted >= 1 },
    { id: 'test-passed',   label: 'Test passed',      hint: 'Pass a skill test to earn this.',                 earned: testsPassed >= 1 },
    { id: 'first-project', label: 'First project',    hint: 'Create your first project to earn this.',         earned: projects >= 1 },
  ]

  // Persist newly earned achievements (earn-once — rows are never deleted)
  const toInsert: { learner_id: string; achievement_id: string }[] = []
  for (const q of qualifications) {
    if (q.earned && !earnedMap.has(q.id)) toInsert.push({ learner_id: learnerId, achievement_id: q.id })
  }
  const trophiedSectionIds = new Set<string>()
  for (const s of journey.sections) {
    const done = s.modules.length > 0 && s.modules.every(m => journey.progressMap.get(m.id)?.completed_at)
    if (done || earnedMap.has(`section:${s.id}`)) trophiedSectionIds.add(s.id)
    if (done && !earnedMap.has(`section:${s.id}`)) toInsert.push({ learner_id: learnerId, achievement_id: `section:${s.id}` })
  }
  for (const l of LEVELS.slice(1)) {
    if (points >= l.min && !earnedMap.has(`level:${l.id}`)) toInsert.push({ learner_id: learnerId, achievement_id: `level:${l.id}` })
  }

  if (toInsert.length > 0) {
    await supabase.from('academy_achievements').upsert(toInsert, {
      onConflict: 'learner_id,achievement_id',
      ignoreDuplicates: true,
    })
  }

  const now = new Date().toISOString()
  const achievements: Achievement[] = qualifications.map(q => {
    const persisted = earnedMap.get(q.id) ?? null
    const earned = q.earned || !!persisted
    return { id: q.id, label: q.label, hint: q.hint, earned, earnedAt: persisted ?? (earned ? now : null) }
  })

  return { achievements, points, level, nextLevel, pctToNextLevel, upToDate, trophiedSectionIds }
}
