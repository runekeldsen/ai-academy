import type { SupabaseClient } from '@supabase/supabase-js'

export type JourneyProgress = {
  module_id: string
  started_at: string
  completed_at: string | null
  completed_steps: number[] | null
}

export type JourneyModule = {
  id: string
  section_id: string
  sectionTitle: string
  title: string
  description: string | null
  difficulty: string | null
  duration_minutes: number | null
  sort_order: number
  prerequisite_module_id: string | null
  created_at: string
}

export type JourneySection = {
  id: string
  title: string
  modules: JourneyModule[]
}

export type Journey = {
  sections: JourneySection[]
  orderedModules: JourneyModule[]
  progressMap: Map<string, JourneyProgress>
  visibleIds: Set<string>
  latestCompletionAt: string | null
}

type RawSection = {
  id: string
  title: string
  sort_order: number | null
  academy_modules: {
    id: string
    title: string
    description: string | null
    difficulty: string | null
    duration_minutes: number | null
    sort_order: number | null
    prerequisite_module_id: string | null
    published: boolean
    created_at: string
  }[]
}

export async function getJourney(
  supabase: SupabaseClient,
  learnerId: string,
  opts?: { trainerId: string | null; teamId: string | null }
): Promise<Journey> {
  let trainerId = opts?.trainerId ?? null
  let teamId = opts?.teamId ?? null

  if (opts === undefined) {
    const { data: profile } = await supabase
      .from('academy_profiles')
      .select('trainer_id, team_id')
      .eq('id', learnerId)
      .single()
    trainerId = profile?.trainer_id ?? null
    teamId = profile?.team_id ?? null
  }

  const [{ data: teamSectionRows }, { data: sections }, { data: progressRows }, { data: exclusions }] =
    await Promise.all([
      teamId
        ? supabase.from('academy_team_sections').select('section_id').eq('team_id', teamId)
        : Promise.resolve({ data: [] as { section_id: string }[] }),
      supabase
        .from('academy_sections')
        .select('id, title, sort_order, academy_modules(id, title, description, difficulty, duration_minutes, sort_order, prerequisite_module_id, published, created_at)')
        .eq('trainer_id', trainerId ?? '')
        .order('sort_order', { ascending: true }),
      supabase
        .from('academy_progress')
        .select('module_id, started_at, completed_at, completed_steps')
        .eq('learner_id', learnerId),
      supabase
        .from('academy_module_exclusions')
        .select('module_id')
        .eq('learner_id', learnerId),
    ])

  const teamSectionIds = (teamSectionRows ?? []).map(r => r.section_id)
  const excludedIds = new Set((exclusions ?? []).map(e => e.module_id))

  const progressMap = new Map<string, JourneyProgress>()
  let latestCompletionAt: string | null = null
  for (const row of (progressRows ?? []) as JourneyProgress[]) {
    progressMap.set(row.module_id, row)
    if (row.completed_at && (!latestCompletionAt || row.completed_at > latestCompletionAt)) {
      latestCompletionAt = row.completed_at
    }
  }

  const journeySections: JourneySection[] = (((sections as unknown as RawSection[]) ?? [])
    .filter(s => teamSectionIds.length === 0 || teamSectionIds.includes(s.id))
    .map(s => ({
      id: s.id,
      title: s.title,
      modules: [...(s.academy_modules ?? [])]
        .filter(m => m.published && !excludedIds.has(m.id))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(m => ({
          id: m.id,
          section_id: s.id,
          sectionTitle: s.title,
          title: m.title,
          description: m.description,
          difficulty: m.difficulty,
          duration_minutes: m.duration_minutes,
          sort_order: m.sort_order ?? 0,
          prerequisite_module_id: m.prerequisite_module_id,
          created_at: m.created_at,
        })),
    }))
    .filter(s => s.modules.length > 0))

  const orderedModules = journeySections.flatMap(s => s.modules)

  return {
    sections: journeySections,
    orderedModules,
    progressMap,
    visibleIds: new Set(orderedModules.map(m => m.id)),
    latestCompletionAt,
  }
}

export function getNextModule(j: Journey, currentModuleId: string): JourneyModule | null {
  const i = j.orderedModules.findIndex(m => m.id === currentModuleId)
  return i >= 0 && i < j.orderedModules.length - 1 ? j.orderedModules[i + 1] : null
}

export function getPrevModule(j: Journey, currentModuleId: string): JourneyModule | null {
  const i = j.orderedModules.findIndex(m => m.id === currentModuleId)
  return i > 0 ? j.orderedModules[i - 1] : null
}

export function getContinueModule(j: Journey): JourneyModule | null {
  return j.orderedModules.find(m => !j.progressMap.get(m.id)?.completed_at) ?? null
}

export function isPrereqUnmet(j: Journey, m: JourneyModule): JourneyModule | null {
  if (!m.prerequisite_module_id) return null
  if (!j.visibleIds.has(m.prerequisite_module_id)) return null
  if (j.progressMap.get(m.prerequisite_module_id)?.completed_at) return null
  return j.orderedModules.find(x => x.id === m.prerequisite_module_id) ?? null
}

export function isNewModule(j: Journey, m: JourneyModule): boolean {
  if (j.progressMap.get(m.id)?.completed_at) return false
  return !!j.latestCompletionAt && m.created_at > j.latestCompletionAt
}
