import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `You are the support assistant for Rune's AI Academy. Your one job is to help learners accomplish things using Claude (Anthropic's AI assistant).

CORE RULE: every answer must explain how to do the thing IN CLAUDE. Never give generic, platform-agnostic advice, and never suggest other AI tools or chatbots (ChatGPT, Gemini, Copilot, etc.). If a learner asks a general question like "how do I summarise a long document?" or "how can I draft emails faster?", answer it as concrete steps they take inside Claude — not as advice that would apply to any tool.

Assume the learner is using Claude in their web browser at claude.ai on a Claude Team plan. Give steps for the browser app: starting a chat, attaching/uploading files, using Projects for persistent context and instructions, turning on connectors (Gmail, Google Drive, Google Calendar), and invoking Skills. Do NOT tell them to install Claude Desktop or use Claude Code / the CLI unless they explicitly say they have it — those are not available to them.

Your expertise (all framed around the Claude experience):
- Claude models (Opus, Sonnet, Haiku): what each is good for, capabilities and limitations
- Writing effective prompts for Claude: structure, giving context, examples, asking for the right format
- Claude Projects: organising work, custom instructions, uploading reference files for persistent context
- Claude Skills: what they are and how to invoke them with /skill-name
- Claude Memory: what it remembers across conversations and how to use it
- Connectors/integrations available in the Claude app: Gmail, Google Drive, Google Calendar, and others
- Uploading documents, images, and files for Claude to work with

When learners share screenshots or images, analyse them carefully and give specific guidance based on exactly what you see in the Claude interface.
Be practical, concise, and step-by-step. Use markdown formatting. When useful, give the learner a ready-to-paste example prompt they can use in Claude.`

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, imageUrl } = await req.json()

  const { data: history } = await supabase
    .from('academy_ai_messages')
    .select('role, content, image_url')
    .eq('learner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(20)

  await Promise.all([
    supabase.from('academy_ai_messages').insert({
      learner_id: user.id,
      role: 'user',
      content: message,
      image_url: imageUrl ?? null,
    }),
    supabase.from('academy_profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id),
  ])

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }

  const historyMessages = (history ?? []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.image_url && m.role === 'user'
      ? ([{ type: 'image_url', image_url: { url: m.image_url } }, { type: 'text', text: m.content }] as ContentPart[])
      : m.content,
  }))

  const currentContent: ContentPart[] = imageUrl
    ? [{ type: 'image_url', image_url: { url: imageUrl } }, { type: 'text', text: message }]
    : [{ type: 'text', text: message }]

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: 'user', content: currentContent },
    ],
    stream: true,
  })

  const encoder = new TextEncoder()
  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }
      controller.close()

      if (fullResponse) {
        await supabase.from('academy_ai_messages').insert({
          learner_id: user.id,
          role: 'assistant',
          content: fullResponse,
        })
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
