import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { questionType, question, criteria, answer } = await req.json()

  if (questionType === 'multiple_choice') {
    return Response.json({ feedback: '', correct: true, score: 100 })
  }

  const typeLabel = questionType === 'prompt_practice'
    ? 'prompt writing exercise'
    : 'knowledge question'

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an encouraging but honest tutor evaluating a learner's answer in an AI training programme about Claude and AI tools.
Respond with JSON only: { "score": <0-100>, "passed": <true if score >= 60>, "feedback": "<2-3 sentences of specific, actionable feedback>" }
Be warm and constructive. If the answer is good, say so clearly. If it needs improvement, explain what's missing and how to fix it.`,
      },
      {
        role: 'user',
        content: `This is a ${typeLabel}.

Question asked: ${question}

Evaluation criteria (what a good answer should include): ${criteria}

Learner's answer: ${answer}

Evaluate the answer and return JSON.`,
      },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const result = JSON.parse(raw)

  return Response.json({
    score: result.score ?? 0,
    passed: result.passed ?? false,
    feedback: result.feedback ?? '',
  })
}
