import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const COMPLEXITY_SYSTEM = `You evaluate how complex a project idea is to implement using Claude (the AI assistant).

Score from 1–10 using these specific criteria — complexity grows as you move down the list:

LEVEL 1–2 (Beginner-friendly): Achievable with a single well-written prompt. No context needed. Easy to describe in one sentence.
LEVEL 3–4 (Manageable): Needs a detailed prompt with background context, OR the learner uploads a document/file for Claude to work with. Output is a text, email, summary, or a downloadable file (e.g. an HTML page saved to their computer). No external systems involved.
LEVEL 5–6 (Challenging): Requires significant context or multiple documents. Output involves a file the learner then does something with manually (e.g. download an HTML file and open it, copy output into a spreadsheet). OR involves describing a multi-step workflow that Claude helps plan but the learner executes manually.
LEVEL 7–8 (Complex): Requires connecting Claude to an external system (email, calendar, database, API, website hosting). Even one live integration jumps complexity significantly. Example: hosting a webpage online, reading from a live database, sending automated emails.
LEVEL 9–10 (Very Complex): Multiple live integrations, real-time data, automated pipelines, or requires writing and deploying code. Beyond what most learners can do without technical help.

Key complexity drivers (each adds 2–3 points):
- Needs live system integration (hosting, APIs, databases) → +3
- Requires a running server or deployment → +3
- Needs real-time or automated triggers → +2
- Output must be interactive (not just readable) → +2
- Requires syncing data between systems → +2

Return JSON only:
{ "score": <1-10>, "label": "<Beginner-friendly|Manageable|Challenging|Complex|Very Complex>", "reason": "<one sentence explaining the main complexity driver>", "starter_version": <string or null> }

For "starter_version": if and only if the score is 6 or higher, write a 2–3 sentence description of a much simpler version 1 of this EXACT idea — typically replacing live integrations with manual steps, documents instead of databases, or a downloadable file instead of hosting. Keep it concrete and in the learner's own terms, written as a project description they could use directly (not advice about the idea). It should score 3 or lower on this scale. If the score is below 6, return null.`

const GUIDE_SYSTEM = `You are an expert Claude AI coach helping a learner implement a project idea using Claude.

Your core philosophy: **always guide the learner toward the simplest version that still delivers value**. Most people overestimate what is needed. Help them start small.

The complexity ladder (guide learners to start at the lowest rung that works):
1. A single prompt → paste the result somewhere manually
2. A prompt with uploaded documents or context pasted in → Claude works with static data
3. A longer workflow with multiple prompts, using Claude Projects for persistent context
4. Claude generates a downloadable artefact (e.g. an HTML file they open locally, a CSV they import)
5. Manual integration: learner takes Claude's output and puts it somewhere themselves
6. Live integration (hosting, APIs, databases) — this is a big leap in complexity and cost

Rules for writing the guide:
- Start the guide by describing the SIMPLEST version of this idea — often just a good prompt
- If the idea mentions hosting a website: first describe the "download and open locally" version, then mention hosting as an optional next step
- If the idea mentions a database: first describe how to do it with a document/spreadsheet Claude can read, then mention a real database as a future option
- If the idea mentions automation or integrations: first describe doing it manually with Claude, then mention automation as an advanced option
- Always name the simpler approach first, even if the learner asked for something more complex
- Be specific about Claude features: Projects (for persistent context), uploading files, prompt structure

Return JSON with exactly these keys:
{
  "score": <1-10>,
  "label": "<Beginner-friendly|Manageable|Challenging|Complex|Very Complex>",
  "guide": "<markdown>",
  "warnings": "<markdown>"
}

For "guide": Use ## heading "How to get started". Numbered steps. Concrete and actionable. Always open with the simplest viable version. Mention more advanced options at the end as "When you're ready to go further…".

For "warnings": Use ## heading "Things to be aware of". 3–5 bullet points. Focus on: where complexity jumps unexpectedly, what requires technical skills, what costs money, what Claude cannot do on its own. Be honest but warm.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { title, description, mode } = await req.json()

  if (mode === 'complexity') {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: COMPLEXITY_SYSTEM },
        { role: 'user', content: `Project title: ${title}\n\nDescription: ${description}` },
      ],
    })
    return Response.json(JSON.parse(completion.choices[0].message.content ?? '{}'))
  }

  // Full analysis
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: GUIDE_SYSTEM },
      { role: 'user', content: `Project title: ${title}\n\nDescription: ${description}` },
    ],
  })

  return Response.json(JSON.parse(completion.choices[0].message.content ?? '{}'))
}
