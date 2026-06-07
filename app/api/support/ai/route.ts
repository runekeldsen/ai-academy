import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `You are an expert AI support assistant for Rune's AI Academy. You help learners use Claude and AI tools effectively.

Your expertise covers:
- Anthropic's Claude: all features, models (Opus, Sonnet, Haiku), capabilities and limitations
- Claude Code (CLI tool): commands, hooks, slash commands, MCP servers, settings, keybindings, IDE extensions
- Claude Skills: what they are, how to invoke them with /skill-name, how to build new ones
- Claude Memory: what to save, how it persists across conversations, best practices for memory files
- Claude Projects: organizing work, maintaining context, sharing instructions
- MCP integrations: Gmail, Google Drive, Google Calendar, n8n, Home Assistant, Vercel, and others
- Prompt engineering: effective prompts, system prompts, chain-of-thought, few-shot examples
- AI automation and productivity workflows

When learners share screenshots or images, analyze them carefully and give specific, actionable guidance based on exactly what you see.
Be practical, concise, and step-by-step when explaining. Use markdown formatting for clarity.`

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

  await supabase.from('academy_ai_messages').insert({
    learner_id: user.id,
    role: 'user',
    content: message,
    image_url: imageUrl ?? null,
  })

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
