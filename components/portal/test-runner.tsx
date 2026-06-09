'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveTestAttempt } from '@/actions/tests'

type Question = {
  id: string
  type: 'multiple_choice' | 'prompt_practice' | 'chat'
  question: string
  options: string[] | null
  correct_answer: string | null
  evaluation_criteria: string | null
}

type AnswerRecord = {
  questionId: string
  answer: string
  feedback: string
  correct: boolean
  score: number
}

type Test = {
  id: string
  title: string
  description: string | null
  questions: Question[]
}

type QuestionState = 'idle' | 'loading' | 'answered'

export function TestRunner({ test }: { test: Test }) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [selected, setSelected] = useState<string>('')
  const [openAnswer, setOpenAnswer] = useState('')
  const [qState, setQState] = useState<QuestionState>('idle')
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean; score: number } | null>(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const questions = test.questions
  const question = questions[current]
  const progress = Math.round((current / questions.length) * 100)

  async function submitAnswer() {
    if (!question) return
    setQState('loading')

    let record: AnswerRecord

    if (question.type === 'multiple_choice') {
      const correct = selected === question.correct_answer
      record = {
        questionId: question.id,
        answer: selected,
        feedback: correct
          ? 'Correct!'
          : `Not quite. The correct answer is: ${question.correct_answer}`,
        correct,
        score: correct ? 100 : 0,
      }
      setFeedback({ text: record.feedback, correct, score: record.score })
    } else {
      const answer = openAnswer.trim()
      const res = await fetch('/api/tests/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType: question.type,
          question: question.question,
          criteria: question.evaluation_criteria ?? '',
          answer,
        }),
      })
      const data = await res.json()
      record = {
        questionId: question.id,
        answer,
        feedback: data.feedback,
        correct: data.passed,
        score: data.score,
      }
      setFeedback({ text: data.feedback, correct: data.passed, score: data.score })
    }

    setAnswers(prev => [...prev, record])
    setQState('answered')
  }

  async function next() {
    setSelected('')
    setOpenAnswer('')
    setFeedback(null)
    setQState('idle')

    if (current + 1 >= questions.length) {
      setSaving(true)
      const allAnswers = [...answers]
      await saveTestAttempt({ testId: test.id, answers: allAnswers })
      setSaving(false)
      setDone(true)
    } else {
      setCurrent(c => c + 1)
    }
  }

  const avgScore = answers.length > 0
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length)
    : 0

  if (done) {
    const passed = avgScore >= 60
    return (
      <div className="space-y-6">
        <div className={`bg-white rounded-xl border p-8 text-center space-y-4 ${passed ? 'border-green-200' : 'border-orange-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${passed ? 'bg-green-50' : 'bg-orange-50'}`}>
            {passed ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>
          <div>
            <p className="font-heading text-4xl font-bold" style={{ color: passed ? '#16a34a' : '#d97706' }}>{avgScore}%</p>
            <p className="mt-1 font-heading text-lg font-semibold text-gray-800">{passed ? 'Well done!' : 'Keep practising'}</p>
            <p className="mt-1 text-sm text-gray-500">
              {passed
                ? 'You passed this test. Review your answers below or go back to tests.'
                : "You didn't quite pass this time. Review your answers and try again when you're ready."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {answers.map((a, i) => {
            const q = questions[i]
            return (
              <div key={a.questionId} className={`bg-white rounded-xl border p-4 space-y-2 ${a.correct ? 'border-green-200' : 'border-red-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${a.correct ? 'bg-green-100' : 'bg-red-50'}`}>
                    {a.correct ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{q?.question}</p>
                    <p className="mt-1 text-xs text-gray-500">{a.feedback}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: a.correct ? '#16a34a' : '#ef4444' }}>{a.score}%</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/portal/tests')}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            ← Back to tests
          </button>
          <button
            onClick={() => { setCurrent(0); setAnswers([]); setDone(false); setFeedback(null); setQState('idle') }}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: '#2563eb' }}
          >
            Retake test
          </button>
        </div>
      </div>
    )
  }

  const canSubmit = question?.type === 'multiple_choice' ? !!selected : openAnswer.trim().length > 10

  const typeLabel: Record<string, string> = {
    multiple_choice: 'Multiple choice',
    prompt_practice: 'Prompt practice',
    chat: 'Knowledge check',
  }

  const typeBadge: Record<string, string> = {
    multiple_choice: 'bg-blue-50 text-blue-600',
    prompt_practice: 'bg-purple-50 text-purple-600',
    chat: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/portal/tests')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
          ← Tests
        </button>
        <h1 className="font-heading text-2xl font-bold text-gray-900">{test.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: '#2563eb' }} />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{current + 1} / {questions.length}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge[question.type]}`}>
            {typeLabel[question.type]}
          </span>
        </div>

        <p className="font-heading text-lg font-semibold text-gray-800 leading-snug">{question.question}</p>

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {(question.options ?? []).map(opt => {
              const isSelected = selected === opt
              const isCorrect = qState === 'answered' && opt === question.correct_answer
              const isWrong = qState === 'answered' && isSelected && opt !== question.correct_answer

              return (
                <button
                  key={opt}
                  disabled={qState !== 'idle'}
                  onClick={() => setSelected(opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    isCorrect ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong ? 'border-red-300 bg-red-50 text-red-800'
                    : isSelected ? 'border-blue-400 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {(question.type === 'prompt_practice' || question.type === 'chat') && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {question.type === 'prompt_practice'
                ? 'Write the prompt you would use:'
                : 'Type your answer:'}
            </p>
            <textarea
              value={openAnswer}
              onChange={e => setOpenAnswer(e.target.value)}
              disabled={qState !== 'idle'}
              rows={5}
              placeholder={question.type === 'prompt_practice' ? 'Write your prompt here…' : 'Write your answer here…'}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg px-4 py-3 text-sm ${feedback.correct ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-orange-50 border border-orange-200 text-orange-800'}`}>
            <div className="flex items-start gap-2">
              <span className="font-semibold shrink-0">{feedback.correct ? '✓' : '○'}</span>
              <p>{feedback.text}</p>
            </div>
            {question.type !== 'multiple_choice' && (
              <p className="mt-1.5 text-xs opacity-70">Score: {feedback.score}/100</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        {qState === 'idle' && (
          <button
            disabled={!canSubmit}
            onClick={submitAnswer}
            className="px-5 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#2563eb' }}
          >
            Submit answer
          </button>
        )}
        {qState === 'loading' && (
          <button disabled className="px-5 py-2 text-sm font-medium rounded-lg text-white opacity-70" style={{ backgroundColor: '#2563eb' }}>
            Evaluating…
          </button>
        )}
        {qState === 'answered' && (
          <button
            onClick={next}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: '#2563eb' }}
          >
            {saving ? 'Saving…' : current + 1 >= questions.length ? 'See results' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
