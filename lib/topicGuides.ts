export const TOPICS = ['financial-review', 'strategy-review', 'effective-meetings'] as const
export type Topic = (typeof TOPICS)[number]

type Guide = {
  title: string
  subtitle: string
  content: string
}

export const TOPIC_GUIDES: Record<Topic, Guide> = {
  'financial-review': {
    title: 'Monthly Financial Review — Your Playbook',
    subtitle: 'The routine you\'ll run every month after the live session.',
    content: `This is the step-by-step you'll follow after the live session, every month. You built the Project shell in the pre-session module — here's how to put it to work, understand what it gives you, and eventually make it repeat itself.

### Step 1: Set your Project instructions once

Your instructions do the heavy lifting so you don't repeat yourself each month. Aim for something like this — adjust the specifics to your area:

\`\`\`
You're helping with our monthly financial review. Each month I'll upload the
latest budget vs. actuals spreadsheet. Compare it to the previous month,
flag any line item that moved more than 10%, and summarise in 3–5
plain-language bullet points a non-finance colleague could understand.
Always end with one recommended action or question to raise.
\`\`\`

### Step 2: Upload this month's numbers

Upload the current budget vs. actuals file to the Project. If you have last month's file already in there from before, replace it — Claude should only see the latest baseline, not a stack of old ones.

### Step 3: Choose your output format

Decide what you want out the other end before you run anything. A chat reply is fine for a quick sanity check, but for anything you'll actually share, ask for a proper document.

**Word, not PowerPoint, is usually the right call.** Claude produces a clean, well-structured Word document reliably. Matching DFDS's exact PowerPoint template and branding is a different problem — Claude will guess at layout, fonts and slide structure, and you'll spend more time fixing formatting than the review saved you. Save PowerPoint for when you're presenting live and genuinely need DFDS's slide branding; use Word for the review itself.

Add this to your prompt — or fold it into your Project instructions in Step 1 if you always want it:

\`\`\`
Give me the review as a Word document, not just chat text.
\`\`\`

### Step 4: Run the review

In a new chat inside the Project:

\`\`\`
Please run this month's review against the file I've uploaded, and give me
the result as a Word document.
\`\`\`

### Step 5: Check it before you trust it

Treat the first result the way you'd treat a first draft from a junior analyst — useful, but worth checking before it goes anywhere. This is the part that actually matters: understanding *why* it says what it says, not just reading the bullets.

\`\`\`
Show me exactly which rows in the spreadsheet support this bullet point.
\`\`\`

\`\`\`
Walk me through how you calculated that percentage change.
\`\`\`

If an answer doesn't hold up, say so — Claude will recalculate rather than defend a wrong number, but only if you check.

### Step 6: Push back and drill down

\`\`\`
Drill into the line item that moved the most — what's driving that change?
\`\`\`

\`\`\`
Is this a one-off or part of a trend over the last few months?
\`\`\`

### Step 7: Add visuals once the structure is right

Get the content right first, then make it easier to scan. Once you're happy with the analysis:

\`\`\`
Add a simple bar chart showing the line items that moved most, and a trend
line for the top 2 metrics over the last 3 months.
\`\`\`

Asking for visuals after the content is settled — not before — means you're not re-explaining chart requirements every time you tweak the numbers underneath.

### Step 8: Package it for your update

For a quick message rather than the full document:

\`\`\`
Turn this into 5 bullet points I can paste directly into my update to the board.
\`\`\`

### Step 9: Turn it into a Skill so it repeats itself

Once the recipe feels right — instructions, file, format, visuals — you don't need to re-explain it every month. Ask Claude to package it as a Skill:

\`\`\`
Turn this into a Skill I can run every month — same instructions, same
output format, one command to kick it off.
\`\`\`

Skills work like the ones from the pre-session basics module: type \`/\` in a new chat and yours will be there, ready to run against this month's file.

### Step 10: Make it a habit

Next month: swap in the new file, and either revisit this Project or run your new Skill. If the answers feel off, it's usually the instructions that need a tweak — not the file.`,
  },
  'strategy-review': {
    title: 'Strategy Review Across Documents — Your Playbook',
    subtitle: 'Turn scattered documents and research into one clear brief.',
    content: `This is the step-by-step you'll follow whenever you need to turn several documents — plus outside research — into one clear strategic view. You built the Project shell in the pre-session module; here's how to run a full review with it.

### Step 1: Set your Project instructions once

\`\`\`
You're helping me synthesise strategy material for DFDS. I'll upload several
documents at a time — reports, decks, notes — and may ask you to pull in
outside research too. Your job is to find the through-line: what's
consistent, what conflicts, and what's missing. Write for a senior
management audience — direct, no fluff, and always cite which document a
claim came from.
\`\`\`

### Step 2: Gather your source material

Upload everything relevant to the Project at once — internal reports, competitor analysis, board decks, market notes. If you want Claude to pull in outside research too, say so explicitly in your prompt; it won't assume.

### Step 3: Run the synthesis

\`\`\`
Based on everything uploaded, what are the 3–4 things I need to know before
our next strategy discussion? Note where the documents agree, where they
disagree, and anything that seems to be missing.
\`\`\`

### Step 4: Pressure-test the summary

\`\`\`
Play devil's advocate — what's the strongest case against this conclusion?
\`\`\`

\`\`\`
Which of these points are you least confident about, and why?
\`\`\`

### Step 5: Package it as an executive brief

\`\`\`
Turn this into a one-page executive summary: headline, 3 key points, and a
recommended next step.
\`\`\`

### Step 6: Keep the Project current

As new documents land — an updated forecast, a competitor move — add them to the Project and ask what's changed since the last summary, rather than starting over from scratch.`,
  },
  'effective-meetings': {
    title: 'Effective Meetings — Your Playbook',
    subtitle: 'Turn raw meeting notes into an action log and clean minutes.',
    content: `This is the step-by-step you'll follow after any meeting where decisions and action items need to be tracked properly. You built the Project shell in the pre-session module — here's how to run it end to end.

### Step 1: Set your Project instructions once

\`\`\`
You're helping me turn raw meeting notes into two things: a clean set of
minutes, and an action log (owner, action, due date). Keep the tone
professional and concise. If a note is ambiguous about who owns an action,
flag it rather than guessing.
\`\`\`

### Step 2: Capture the raw notes

Right after the meeting, paste or upload your raw notes into the Project — bullet points, half-sentences, whatever you scribbled during the call. Don't tidy them up first; that's the job you're about to hand off.

### Step 3: Generate the action log

\`\`\`
From these notes, build an action log: owner, action, due date. Flag
anything where the owner or deadline isn't clear.
\`\`\`

### Step 4: Generate the minutes

\`\`\`
Now turn the same notes into short, professional minutes: attendees, key
discussion points, decisions made. Keep it to one page.
\`\`\`

### Step 5: Send it and track follow-through

\`\`\`
Draft a short follow-up message I can send to the group with the minutes
and action log attached.
\`\`\`

Before your next meeting on the same topic, ask Claude to check what's outstanding from the last action log — that's your agenda starter.

### Step 6: Make it routine

Do this straight after every meeting, while the notes are still fresh. The more consistently you feed it raw notes, the less editing the output needs.`,
  },
}
