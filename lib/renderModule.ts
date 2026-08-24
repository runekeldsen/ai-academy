import { marked, type Tokens } from 'marked'

const STEP_HEADING = /^step\s+\d+/i

export async function renderModuleContent(content: string): Promise<{ html: string; stepCount: number }> {
  const renderer = new marked.Renderer()
  renderer.code = ({ text }: { text: string }) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return `<div class="prompt-block"><textarea class="prompt-textarea" readonly>${escaped}</textarea><button class="copy-btn">Copy prompt</button></div>`
  }

  let stepCounter = 0
  renderer.heading = function (token: Tokens.Heading) {
    const inner = this.parser.parseInline(token.tokens)
    if (token.depth === 2 && STEP_HEADING.test(token.text)) {
      const idx = stepCounter++
      return `<h2 class="step-heading"><button type="button" class="step-check" data-step-index="${idx}" aria-label="Mark step as done"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><span>${inner}</span></h2>\n`
    }
    return `<h${token.depth}>${inner}</h${token.depth}>\n`
  }

  const html = await marked(content ?? '', { breaks: true, renderer })
  return { html, stepCount: stepCounter }
}
