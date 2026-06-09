'use client'

import { useState } from 'react'
import { createQuestion, deleteQuestion } from '@/actions/tests'

type Question = {
  id: string
  type: 'multiple_choice' | 'prompt_practice' | 'chat'
  question: string
  options: string[] | null
  correct_answer: string | null
  evaluation_criteria: string | null
  sort_order: number
}

type QuestionType = 'multiple_choice' | 'prompt_practice' | 'chat'

const typeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Multiple choice',
  prompt_practice: 'Prompt practice',
  chat: 'Knowledge check',
}

const typeBadge: Record<QuestionType, string> = {
  multiple_choice: 'bg-blue-50 text-blue-600',
  prompt_practice: 'bg-purple-50 text-purple-600',
  chat: 'bg-amber-50 text-amber-700',
}

export function QuestionList({ testId, questions: initial }: { testId: string; questions: Question[] }) {
  const [questions, setQuestions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [criteria, setCriteria] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const filteredOptions = options.filter(o => o.trim())
    const res = await createQuestion({
      testId,
      type,
      question: questionText.trim(),
      options: type === 'multiple_choice' ? filteredOptions : null,
      correctAnswer: type === 'multiple_choice' ? correctAnswer : null,
      evaluationCriteria: type !== 'multiple_choice' ? criteria : null,
      sortOrder: questions.length,
    })

    if (res.error) { setError(res.error); setSaving(false); return }

    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      type,
      question: questionText.trim(),
      options: type === 'multiple_choice' ? filteredOptions : null,
      correct_answer: type === 'multiple_choice' ? correctAnswer : null,
      evaluation_criteria: type !== 'multiple_choice' ? criteria : null,
      sort_order: prev.length,
    }])

    setQuestionText('')
    setOptions(['', '', '', ''])
    setCorrectAnswer('')
    setCriteria('')
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    await deleteQuestion(id, testId)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-gray-800">Questions</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          {showForm ? 'Cancel' : '+ Add question'}
        </button>
      </div>

      {questions.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 px-5 py-6 text-center">
          No questions yet. Add your first question above.
        </p>
      )}

      {questions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-4 px-5 py-4">
              <span className="text-xs text-gray-400 shrink-0 mt-0.5 w-4">{i + 1}.</span>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-gray-800">{q.question}</p>
                {q.type === 'multiple_choice' && q.options && (
                  <p className="text-xs text-gray-400">{q.options.join(' · ')} · Correct: {q.correct_answer}</p>
                )}
                {q.evaluation_criteria && (
                  <p className="text-xs text-gray-400 italic">Criteria: {q.evaluation_criteria}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeBadge[q.type]}`}>
                {typeLabels[q.type]}
              </span>
              <button onClick={() => handleDelete(q.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Question type</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(typeLabels) as QuestionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    type === t ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {type === 'multiple_choice' && 'Learner picks from your options. Correct answer is checked automatically.'}
              {type === 'prompt_practice' && 'Learner writes a prompt. AI evaluates it against your criteria and gives feedback.'}
              {type === 'chat' && 'Learner answers a question in free text. AI evaluates the answer and gives feedback.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Question</label>
            <textarea
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              required
              rows={2}
              placeholder={
                type === 'prompt_practice'
                  ? 'e.g. Write a prompt that asks Claude to explain a concept to a non-technical audience.'
                  : type === 'chat'
                  ? 'e.g. What are the two ways to make Claude plan before executing?'
                  : 'e.g. What does Plan Mode do in Claude Code?'
              }
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {type === 'multiple_choice' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Answer options</label>
                {options.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-1.5"
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Correct answer</label>
                <select
                  value={correctAnswer}
                  onChange={e => setCorrectAnswer(e.target.value)}
                  required
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">— Select correct answer —</option>
                  {options.filter(o => o.trim()).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {type !== 'multiple_choice' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Evaluation criteria</label>
              <textarea
                value={criteria}
                onChange={e => setCriteria(e.target.value)}
                required
                rows={3}
                placeholder={
                  type === 'prompt_practice'
                    ? 'e.g. The prompt should specify the audience, request a specific format, and include context about the topic.'
                    : 'e.g. The answer should mention both clarifying questions and Plan Mode (/plan or Shift+Tab).'
                }
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <p className="text-xs text-gray-400">This is what the AI uses to evaluate the learner's answer. Be specific.</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: '#2563eb' }}
            >
              {saving ? 'Adding…' : 'Add question'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
