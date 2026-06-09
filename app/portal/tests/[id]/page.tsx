import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TestRunner } from '@/components/portal/test-runner'

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: test } = await supabase
    .from('academy_skill_tests')
    .select('id, title, description, academy_test_questions(id, type, question, options, correct_answer, evaluation_criteria, sort_order)')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (!test) notFound()

  const questions = [...(test.academy_test_questions ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div className="max-w-2xl">
      <TestRunner test={{ ...test, questions }} />
    </div>
  )
}
