import { PrintButton } from '@/components/portal/print-button'

type Tip = { title: string; body: string }
type Group = { heading: string; tips: Tip[] }

const groups: Group[] = [
  {
    heading: 'Get better answers',
    tips: [
      { title: 'Ask for options', body: 'Unsure how to approach something? Say "Give me 2–3 options and I\'ll choose."' },
      { title: 'Tell it to ask first', body: 'Add "Ask me questions if anything is unclear before you start."' },
      { title: 'Say what "good" looks like', body: 'Spell out the audience, length, tone and format you want.' },
      { title: 'Show an example', body: 'Paste a sample of the style or output you want it to match.' },
      { title: 'Give it a role', body: '"Act as a careful editor…" focuses the response.' },
    ],
  },
  {
    heading: 'Stay in control of context',
    tips: [
      { title: 'Use /clear to switch topics', body: 'Starting something unrelated? Clear the chat so old context doesn\'t bleed in.' },
      { title: 'One task per conversation', body: 'Keep a chat focused; start a fresh one for a new job.' },
      { title: 'Correct course early', body: 'If it drifts, stop and redirect straight away rather than at the end.' },
      { title: 'Re-anchor long chats', body: 'Ask "Summarise what we\'ve decided so far" to get back on track.' },
    ],
  },
  {
    heading: 'Work step by step',
    tips: [
      { title: 'Start rough, then refine', body: 'Get a draft first, then ask for specific changes.' },
      { title: 'Ask "why"', body: 'Request its reasoning to check it\'s on the right track.' },
      { title: 'Turn plans into checklists', body: 'Ask for numbered steps you can tick off as you go.' },
      { title: 'Reuse what works', body: 'Found a prompt that nails it? Save it and use it again.' },
    ],
  },
]

export default function TipsPage() {
  return (
    <div className="cheat-sheet max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Claude Cheat Sheet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Small habits that make a big difference. Print it and keep it next to you.
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
        {groups.map(group => (
          <section key={group.heading} className="bg-white rounded-xl border border-gray-200 p-5 print:border-gray-300 break-inside-avoid">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wide mb-3" style={{ color: '#2563eb' }}>
              {group.heading}
            </h2>
            <ul className="space-y-3">
              {group.tips.map(tip => (
                <li key={tip.title}>
                  <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{tip.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center print:mt-4">Rune&apos;s AI Academy · Claude Cheat Sheet</p>
    </div>
  )
}
