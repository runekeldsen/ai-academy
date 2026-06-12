import { NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getJourney, getContinueModule } from '@/lib/journey'
import { POINTS } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

type AnswerRecord = { score: number }

type LearnerRow = {
  id: string
  first_name: string
  email: string | null
  email_nudges: boolean
  trainer_id: string | null
  team_id: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.NUDGE_API_SECRET || auth !== `Bearer ${process.env.NUDGE_API_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: learners } = await admin
    .from('academy_profiles')
    .select('id, first_name, email, email_nudges, trainer_id, team_id, created_at')
    .eq('role', 'learner')
    .not('email', 'is', null)

  const now = Date.now()
  const daysAgo = (iso: string) => (now - new Date(iso).getTime()) / 86_400_000

  const results = await Promise.all(
    ((learners ?? []) as LearnerRow[]).map(async l => {
      const [journey, { data: attempts }, { data: projects }] = await Promise.all([
        getJourney(admin, l.id, { trainerId: l.trainer_id, teamId: l.team_id }),
        admin
          .from('academy_test_attempts')
          .select('started_at, completed_at, answers')
          .eq('learner_id', l.id),
        admin
          .from('academy_projects')
          .select('id, updated_at')
          .eq('learner_id', l.id),
      ])

      let lastActiveAt: string | null = null
      let completionsLast7d = 0
      for (const p of journey.progressMap.values()) {
        for (const t of [p.started_at, p.completed_at]) {
          if (t && (!lastActiveAt || t > lastActiveAt)) lastActiveAt = t
        }
        if (p.completed_at && daysAgo(p.completed_at) <= 7) completionsLast7d++
      }
      for (const a of (attempts ?? []) as { started_at: string | null; completed_at: string | null }[]) {
        for (const t of [a.started_at, a.completed_at]) {
          if (t && (!lastActiveAt || t > lastActiveAt)) lastActiveAt = t
        }
      }
      for (const p of (projects ?? []) as { updated_at: string | null }[]) {
        if (p.updated_at && (!lastActiveAt || p.updated_at > lastActiveAt)) lastActiveAt = p.updated_at
      }

      const testsPassed = ((attempts ?? []) as { completed_at: string | null; answers: AnswerRecord[] | null }[]).filter(a => {
        if (!a.completed_at) return false
        const answers = a.answers ?? []
        if (answers.length === 0) return false
        return Math.round(answers.reduce((s, x) => s + (x.score ?? 0), 0) / answers.length) >= 60
      }).length

      const completedModules = journey.orderedModules.filter(m => journey.progressMap.get(m.id)?.completed_at).length
      const totalModules = journey.orderedModules.length
      const next = getContinueModule(journey)
      const pointsTotal =
        completedModules * POINTS.module +
        testsPassed * POINTS.test +
        Math.min((projects ?? []).length, 5) * POINTS.project
      const newModulesLast7d = journey.orderedModules.filter(
        m => daysAgo(m.created_at) <= 7 && !journey.progressMap.get(m.id)?.completed_at
      ).length

      return {
        id: l.id,
        firstName: l.first_name,
        email: l.email,
        emailNudges: l.email_nudges,
        daysInactive: Math.floor(daysAgo(lastActiveAt ?? l.created_at)),
        completionsLast7d,
        pointsTotal,
        completedModules,
        totalModules,
        nextModule: next ? { title: next.title } : null,
        newModulesLast7d,
      }
    })
  )

  return Response.json(results)
}
