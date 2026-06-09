import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TestForm } from '@/components/trainer/test-form'
import { QuestionList } from '@/components/trainer/question-list'

type Question = {
  id: string
  type: 'multiple_choice' | 'prompt_practice' | 'chat'
  question: string
  options: string[] | null
  correct_answer: string | null
  evaluation_criteria: string | null
  sort_order: number
}

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: test } = await supabase
    .from('academy_skill_tests')
    .select('id, title, description, module_id, published, academy_test_questions(id, type, question, options, correct_answer, evaluation_criteria, sort_order)')
    .eq('id', id)
    .eq('trainer_id', user!.id)
    .single()

  if (!test) notFound()

  const { data: modules } = await supabase
    .from('academy_modules')
    .select('id, title')
    .eq('trainer_id', user!.id)
    .order('title', { ascending: true })

  const questions = [...(test.academy_test_questions as Question[] ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Edit test</h1>
        <p className="mt-1 text-sm text-gray-500">Update test details and manage questions.</p>
      </div>

      <TestForm
        modules={modules ?? []}
        defaultValues={{ id: test.id, title: test.title, description: test.description ?? '', moduleId: test.module_id ?? '', published: test.published }}
      />

      <QuestionList testId={test.id} questions={questions} />
    </div>
  )
}
