'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTest(data: {
  title: string
  description: string
  moduleId: string | null
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: row, error } = await supabase
    .from('academy_skill_tests')
    .insert({ title: data.title, description: data.description, module_id: data.moduleId || null, trainer_id: user.id })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/trainer/tests')
  return { id: row.id }
}

export async function updateTest(id: string, data: {
  title: string
  description: string
  moduleId: string | null
  published: boolean
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('academy_skill_tests')
    .update({ title: data.title, description: data.description, module_id: data.moduleId || null, published: data.published })
    .eq('id', id).eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/tests')
  revalidatePath('/portal/tests')
  return {}
}

export async function deleteTest(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_skill_tests').delete().eq('id', id).eq('trainer_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/tests')
  return {}
}

export async function createQuestion(data: {
  testId: string
  type: 'multiple_choice' | 'prompt_practice' | 'chat'
  question: string
  options: string[] | null
  correctAnswer: string | null
  evaluationCriteria: string | null
  sortOrder: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_test_questions').insert({
    test_id: data.testId,
    type: data.type,
    question: data.question,
    options: data.options,
    correct_answer: data.correctAnswer,
    evaluation_criteria: data.evaluationCriteria,
    sort_order: data.sortOrder,
  })
  if (error) return { error: error.message }

  revalidatePath(`/trainer/tests/${data.testId}/edit`)
  return {}
}

export async function updateQuestion(id: string, data: {
  type: 'multiple_choice' | 'prompt_practice' | 'chat'
  question: string
  options: string[] | null
  correctAnswer: string | null
  evaluationCriteria: string | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_test_questions').update({
    type: data.type,
    question: data.question,
    options: data.options,
    correct_answer: data.correctAnswer,
    evaluation_criteria: data.evaluationCriteria,
  }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/tests')
  return {}
}

export async function deleteQuestion(id: string, testId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_test_questions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/trainer/tests/${testId}/edit`)
  return {}
}

export async function saveTestAttempt(data: {
  testId: string
  answers: { questionId: string; answer: string; feedback: string; correct: boolean; score: number }[]
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('academy_test_attempts').insert({
    test_id: data.testId,
    learner_id: user.id,
    answers: data.answers,
    completed_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }

  return {}
}
