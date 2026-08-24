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
    content: `This is the full walkthrough for the monthly financial review — from creating the Project through to turning it into a Skill you can run with one command. The pre-session gave you a taste; this is the real thing. And the real point of this guide isn't the exact prompts below — it's watching the output get better as you put more thought into what you ask for. That's the skill worth taking away: the more you invest in instructions, context and format, the more repeatable and higher-quality the result. Everything below is deliberately ordered to make that visible.

### Step 1: Create your Project

In the sidebar, click **Projects → New project**. Call it something you'll recognize next month — "Monthly Financial Review" works fine. This is the one-time container everything else in this guide lives inside: your instructions, this month's file, and every conversation about the review.

### Step 2: Start rough — see the ceiling

Try the laziest possible version first, so you have something to compare against later:

\`\`\`
Help me with our financial review.
\`\`\`

It'll produce *something* — but generic. Claude has no idea who it's writing for, what "review" means to you, what counts as worth flagging, or what shape the answer should take. It's guessing on every dimension at once. That's the ceiling of a lazy prompt, and it's low.

### Step 3: Turn it into instructions you'll reuse every month

Now give it what it was missing — the recurring shape of the task, a concrete threshold, the audience, and the format of the answer:

\`\`\`
You're helping with our monthly financial review. Each month I'll upload the
latest budget vs. actuals spreadsheet. Compare it to the previous month,
flag any line item that moved more than 10%, and summarise in 3–5
plain-language bullet points a non-finance colleague could understand.
Always end with one recommended action or question to raise.
\`\`\`

Set this as your **Project instructions**, not a one-off message. This is the highest-leverage step in the whole playbook — you write it once, and it pays out every single month without you re-explaining anything.

### Step 4: Upload this month's numbers

Upload the current budget vs. actuals file to the Project. If last month's file is still in there, replace it — Claude should only see the latest baseline, not a stack of old ones.

### Step 5: Decide the deliverable — Word, not PowerPoint

Add one more piece of context before you run anything: what format do you actually need back?

**Word, not PowerPoint, is usually the right call.** Claude produces a clean, well-structured Word document reliably. Matching DFDS's exact PowerPoint template and branding is a different problem — Claude will guess at layout, fonts and slide structure, and you'll spend more time fixing formatting than the review saved you. Save PowerPoint for when you're presenting live and genuinely need DFDS's slide branding; use Word for the review itself.

\`\`\`
Give me the review as a Word document, not just chat text.
\`\`\`

Fold this into your Step 3 instructions once you know you'll always want it.

### Step 6: Run it

\`\`\`
Please run this month's review against the file I've uploaded, and give me
the result as a Word document.
\`\`\`

Compare this to Step 2. Same underlying question — "review this for me" — but a completely different quality of answer, because of what you invested upstream.

### Step 7: Verify before you trust it

Treat the result like a first draft from a junior analyst — useful, but worth checking before it goes anywhere. This is the part that actually matters: understanding *why* it says what it says, not just reading the bullets.

\`\`\`
Show me exactly which rows in the spreadsheet support this bullet point.
\`\`\`

\`\`\`
Walk me through how you calculated that percentage change.
\`\`\`

If an answer doesn't hold up, say so — Claude will recalculate rather than defend a wrong number, but only if you check.

### Step 8: Push back and drill down

Don't accept the first answer as the final one:

\`\`\`
Drill into the line item that moved the most — what's driving that change?
\`\`\`

\`\`\`
Is this a one-off or part of a trend over the last few months?
\`\`\`

### Step 9: Use Claude as a sounding board, not just a doer

So far every prompt has told Claude what to *do*. That's only half of what it's good for — it's also useful as something to think *with*. Instead of issuing instructions, ask it to weigh in:

\`\`\`
Give me 2–3 different ways to present this trend to the board. Which would
you recommend, and why?
\`\`\`

\`\`\`
Review this analysis against financial reporting best practice. What's
missing, or what would make it stronger?
\`\`\`

\`\`\`
What blind spots or unstated assumptions does this analysis have? What would
a skeptical CFO push back on?
\`\`\`

This is often where the real value shows up — not in the first answer, but in what surfaces when you ask it to critique its own work.

### Step 10: Pull in outside context with web search

Web search is enabled on your account — use it when the spreadsheet alone can't explain something. Say explicitly when you want Claude to search, rather than assuming it will:

\`\`\`
Search for recent news that could explain this month's [fuel prices / freight
rates / relevant market] movement, and note anything relevant in the summary.
\`\`\`

\`\`\`
How does this month's [metric] compare to typical benchmarks for shipping
and logistics companies? Search if you need current figures.
\`\`\`

Ask it to cite what it found so you can sanity-check the source — treat search results with the same "verify before you trust it" habit from Step 7.

### Step 11: Add visuals once the structure is right

\`\`\`
Add a simple bar chart showing the line items that moved most, and a trend
line for the top 2 metrics over the last 3 months.
\`\`\`

Notice the order: content and structure first, polish second. Asking for visuals before the analysis is settled means re-explaining chart requirements every time the numbers underneath change.

### Step 12: Reformat the same result for a different audience

The analysis doesn't change — only its shape does:

\`\`\`
Turn this into 5 bullet points I can paste directly into my update to the board.
\`\`\`

### Step 13: Turn it into a Skill so it repeats itself

This is the payoff for everything above. Once the recipe works — instructions, file, format, verification habit, visuals — package it so you never re-explain it again:

\`\`\`
Turn this into a Skill I can run every month — same instructions, same
output format, one command to kick it off.
\`\`\`

Skills work like the ones from the pre-session basics module: type \`/\` in a new chat and yours will be there, ready to run against this month's file.

### Step 14: Open and read the Agent SOP

When Claude builds you a Skill, it writes a procedure behind it — the **Agent SOP** — laying out exactly what the Skill checks, asks, and does each time it runs. Open it and read it, the way you'd read a colleague's checklist before trusting them to run something unsupervised.

If a step is wrong, missing, or too rigid, don't just complain about the output — edit the SOP directly, or ask Claude to revise it:

\`\`\`
Open the SOP for this Skill and add a step that checks the file was uploaded
this month before starting the review.
\`\`\`

This is the same lever from Step 3, one level up: you're no longer just writing instructions for a conversation, you're writing instructions for a repeatable procedure. The stronger the SOP, the more consistently the Skill performs — every time, without you in the room.

### Step 15: Make the Skill ask for what it's missing

A good Skill doesn't fail silently or guess when something's wrong — it asks. Build that in explicitly:

\`\`\`
If I run this Skill and this month's file isn't in the Project yet, have it
stop and ask me to upload it before continuing.
\`\`\`

You can go further and have it interview you for anything the numbers alone can't explain — the judgment calls only a person can make:

\`\`\`
Before finishing the report, have the Skill ask me 2–3 questions about
anything it can't explain from the numbers alone — for example, if a cost
category jumped, ask what drove it — and fold my answers into the summary.
\`\`\`

That turns the Skill from a report generator into something closer to a structured interview: it does the mechanical analysis, then asks you for the parts only you can answer, and combines both into the final output.

### Step 16: Save, update, and share it

When Claude finishes building a Skill, it will typically offer you a save (and sometimes a download) option — take it. Click **Save** rather than assuming it's kept automatically; confirm during the live session exactly what that screen looks like for your account. Once saved, it's there under \`/\` next time. To change it later, don't rebuild from scratch:

\`\`\`
Update my monthly financial review Skill to also flag any line item that's
more than 20% over budget for the year, not just the monthly move.
\`\`\`

If your team is on a Team or Enterprise plan, a working Skill can usually be shared so colleagues use the same one instead of rebuilding it themselves. Once yours is solid, that's worth doing — it's the fastest way the rest of EMT, and eventually DFDS, benefits from the work you already put in.

### Step 17: Nest skills inside skills

A Skill doesn't have to solve every part of the problem itself — it can call another Skill as a step. Remember the PowerPoint caution from Step 5? This is how it gets resolved properly. If someone on the team has already built and refined a Skill that reliably produces DFDS-branded PowerPoints, your financial review Skill doesn't need to solve formatting itself:

\`\`\`
When generating the final output, use the "DFDS PowerPoint" Skill to build
the slide version, instead of trying to format it yourself.
\`\`\`

Rather than asking Claude to freehand DFDS's branding from scratch every time, someone invests once in a narrow, well-tested Skill for exactly that, and every other Skill can lean on it. It's the same "invest once, reuse forever" idea from Step 13 — just one layer up: Skills built on Skills.

> **The moves that carry to any project — not just this one:**
>
> - Give Claude the recurring shape of the task, not just an isolated question
> - Name the audience and the exact format you want back
> - Verify the first answer before you trust it — ask *how* it got there
> - Don't stop at the first draft — drill in, push back
> - Ask for options, a best-practice review, or blind spots — not just instructions
> - Bring in outside context with web search when your files alone don't explain something
> - Add polish (visuals, formatting) only once the content is right
> - Once the recipe works, turn it into a Skill — then open and refine its SOP the same way you refined your original instructions
> - Build in questions for whatever the Skill can't know on its own
> - Share what works instead of leaving everyone to rebuild it
> - Let Skills call other Skills — a well-built narrow Skill becomes a building block, not something rebuilt every time
>
> **Specific to this one:** the budget vs. actuals file, the 10% variance threshold, and Word as the default output format.`,
  },
  'strategy-review': {
    title: 'Strategy Review Across Documents — Your Playbook',
    subtitle: 'Turn scattered documents and research into one clear brief.',
    content: `This is the full walkthrough for pulling together a strategy review — from creating the Project through to turning it into a Skill you can run with one command. The pre-session gave you a taste; this is the real thing. And the real point of this guide isn't the exact prompts below — it's watching the output get better as you put more thought into what you ask for. That's the skill worth taking away: the more you invest in instructions, context and format, the more repeatable and higher-quality the result. Everything below is deliberately ordered to make that visible.

### Step 1: Create your Project

In the sidebar, click **Projects → New project**. Call it something like "Strategy Reviews" — a name that'll make sense the next time you need to pull one together. This is the one-time container everything else in this guide lives inside: your instructions, your source documents, and every synthesis you run.

### Step 2: Start rough — see the ceiling

Try the laziest possible version first, so you have something to compare against later:

\`\`\`
Help me pull together a strategy summary.
\`\`\`

It'll produce *something* — but generic. Claude has no idea who it's for, what to prioritise when sources disagree, how deep to go, or what shape the answer should take. It's guessing on every dimension at once. That's the ceiling of a lazy prompt, and it's low.

### Step 3: Turn it into instructions you'll reuse every time

Now give it what it was missing — the recurring shape of the task, how to handle disagreement, the audience, and the standard it should hold itself to:

\`\`\`
You're helping me synthesise strategy material for DFDS. I'll upload several
documents at a time — reports, decks, notes — and may ask you to pull in
outside research too. Your job is to find the through-line: what's
consistent, what conflicts, and what's missing. Write for a senior
management audience — direct, no fluff, and always cite which document a
claim came from.
\`\`\`

Set this as your **Project instructions**, not a one-off message. This is the highest-leverage step in the whole playbook — you write it once, and it pays out every time you run a synthesis.

### Step 4: Gather your source material

Upload everything relevant to the Project at once — internal reports, competitor analysis, board decks, market notes. If you want Claude to pull in outside research too, say so explicitly; it won't assume.

### Step 5: Decide the deliverable

Strategy work usually needs two different things: a written brief to read beforehand, and a slide version for the room. Decide which before you run anything.

\`\`\`
Give me the result as a one-page Word brief I can read before the meeting,
not just chat text.
\`\`\`

If you also need slides and DFDS branding matters, lean on a dedicated PowerPoint skill for that rather than asking this Project to freehand the template — Claude can build the deck, but it won't know DFDS's exact layout and branding unless that's fed in separately. See Step 17.

### Step 6: Run the synthesis

\`\`\`
Based on everything uploaded, what are the 3–4 things I need to know before
our next strategy discussion? Give me the result as a Word document, and
note where the documents agree, where they disagree, and anything missing.
\`\`\`

Compare this to Step 2. Same underlying question, completely different quality of answer — because of what you invested upstream.

### Step 7: Verify before you trust it

Treat the result like a first draft from a junior analyst — useful, but worth checking before it goes anywhere. This is the part that actually matters: understanding *why* it says what it says.

\`\`\`
Show me exactly where in the documents each of these claims comes from.
\`\`\`

\`\`\`
Which of these points came from a single source versus multiple agreeing sources?
\`\`\`

If a claim doesn't hold up under that check, say so — Claude will revise rather than defend a weak citation, but only if you check.

### Step 8: Pressure-test the summary

Don't accept the first answer as the final one:

\`\`\`
Play devil's advocate — what's the strongest case against this conclusion?
\`\`\`

\`\`\`
Which of these points are you least confident about, and why?
\`\`\`

### Step 9: Use Claude as a sounding board, not just a doer

So far every prompt has told Claude what to *do*. It's also useful as something to think *with*. Instead of issuing instructions, ask it to weigh in:

\`\`\`
Give me 2–3 different ways to frame this for the board. Which would you
recommend, and why?
\`\`\`

\`\`\`
Review this against how a well-structured strategy memo should be built.
What's missing, or what would make it stronger?
\`\`\`

\`\`\`
What blind spots or unstated assumptions does this synthesis have?
\`\`\`

This is often where the real value shows up — not in the first answer, but in what surfaces when you ask it to critique its own work.

### Step 10: Pull in outside context with web search

This is where web search earns its keep for strategy work — most of what you need won't already be sitting in your own documents. Say explicitly when you want Claude to search, rather than assuming it will:

\`\`\`
Search for recent news or analyst commentary on [competitor / market] that's
relevant to this, and note where it supports or contradicts our internal view.
\`\`\`

Ask it to cite what it found so you can check the source — the same "verify before you trust it" habit from Step 7, applied to the open web.

### Step 11: Add visuals once the structure is right

\`\`\`
Add a simple diagram or timeline that makes the through-line easier to
follow at a glance.
\`\`\`

Content first, polish second — asking for visuals before the analysis is settled means re-explaining what they should show every time the summary changes underneath.

### Step 12: Reformat for a different audience

The analysis doesn't change — only its shape does:

\`\`\`
Turn this into a one-page executive summary: headline, 3 key points, and a
recommended next step.
\`\`\`

### Step 13: Turn it into a Skill so it repeats itself

This is the payoff for everything above. Once the recipe works — instructions, sources, format, verification habit — package it so you never re-explain it again:

\`\`\`
Turn this into a Skill I can run whenever I need a strategy synthesis — same
instructions, same verification habit, one command to kick it off.
\`\`\`

Skills work like the ones from the pre-session basics module: type \`/\` in a new chat and yours will be there.

### Step 14: Open and read the Agent SOP

When Claude builds you a Skill, it writes a procedure behind it — the **Agent SOP** — laying out exactly what the Skill checks, asks, and does each time it runs. Open it and read it, the way you'd read a colleague's checklist before trusting them to run something unsupervised.

\`\`\`
Open the SOP for this Skill and add a step that checks all uploaded documents
are dated within the last quarter before starting the synthesis.
\`\`\`

The stronger the SOP, the more consistently the Skill performs — every time, without you in the room.

### Step 15: Make the Skill ask for what it's missing

A good Skill doesn't guess when something's unclear — it asks:

\`\`\`
If I run this Skill and haven't said who the audience is, have it ask me
before starting rather than assuming.
\`\`\`

You can go further and have it interview you for anything the documents alone can't resolve:

\`\`\`
Before finishing, have the Skill ask me which of two conflicting figures is
authoritative if the sources disagree, and fold my answer into the summary.
\`\`\`

That turns the Skill from a report generator into something closer to a structured interview: it does the mechanical synthesis, then asks you for the judgment calls only a person can make.

### Step 16: Save, update, and share it

When Claude finishes building a Skill, it will typically offer you a save (and sometimes a download) option — take it. Once saved, it's there under \`/\` next time. To change it later, don't rebuild from scratch:

\`\`\`
Update my strategy synthesis Skill to also flag when a document is more than
one quarter old.
\`\`\`

If your team is on a Team or Enterprise plan, a working Skill can usually be shared so colleagues use the same one instead of rebuilding it themselves.

### Step 17: Nest skills inside skills

A Skill doesn't have to solve every part of the problem itself — it can call another Skill as a step. If someone on the team has already built and refined a Skill that reliably produces DFDS-branded slides, your strategy Skill doesn't need to solve formatting itself:

\`\`\`
When I ask for slides, use the "DFDS PowerPoint" Skill to build them — read
its SKILL.md before starting so the branding and layout stay consistent.
\`\`\`

> **The moves that carry to any project — not just this one:**
>
> - Give Claude the recurring shape of the task, not just an isolated question
> - Name the audience and the exact format you want back
> - Verify the first answer before you trust it — ask *how* it got there
> - Don't stop at the first draft — drill in, push back
> - Ask for options, a best-practice review, or blind spots — not just instructions
> - Bring in outside context with web search when your files alone don't explain something
> - Add polish (visuals, formatting) only once the content is right
> - Once the recipe works, turn it into a Skill — then open and refine its SOP the same way you refined your original instructions
> - Build in questions for whatever the Skill can't know on its own
> - Share what works instead of leaving everyone to rebuild it
> - Let Skills call other Skills — a well-built narrow Skill becomes a building block, not something rebuilt every time
>
> **Specific to this one:** multiple source documents that may disagree, citing where every claim came from, web research for market/competitor context, and a Word brief as the default with a slide version available via a shared template Skill.`,
  },
  'effective-meetings': {
    title: 'Effective Meetings — Your Playbook',
    subtitle: 'Turn raw meeting notes into an action log and clean minutes.',
    content: `This is the full walkthrough for turning meeting notes into minutes and an action log — from creating the Project through to turning it into a Skill you can run with one command. The pre-session gave you a taste; this is the real thing. And the real point of this guide isn't the exact prompts below — it's watching the output get better as you put more thought into what you ask for. That's the skill worth taking away: the more you invest in instructions, context and format, the more repeatable and higher-quality the result. Everything below is deliberately ordered to make that visible.

### Step 1: Create your Project

In the sidebar, click **Projects → New project**. Name it after the meeting series — e.g. "[Committee name] Notes" — so it's obvious which recurring meeting it belongs to. This is the one-time container everything else in this guide lives inside: your instructions, your raw notes, and every set of minutes you generate.

### Step 2: Start rough — see the ceiling

Try the laziest possible version first, so you have something to compare against later:

\`\`\`
Help me write up meeting notes.
\`\`\`

It'll produce *something* — but generic. Claude doesn't know whether you want minutes, an action log, or both, what "owner and deadline" convention you use, or how to handle a note that's ambiguous about who's responsible. It's guessing on every dimension at once. That's the ceiling of a lazy prompt, and it's low.

### Step 3: Turn it into instructions you'll reuse every time

Now give it what it was missing — the recurring shape of the output, a convention for owners and deadlines, and what to do when something's unclear:

\`\`\`
You're helping me turn raw meeting notes into two things: a clean set of
minutes, and an action log (owner, action, due date). Keep the tone
professional and concise. If a note is ambiguous about who owns an action,
flag it rather than guessing.
\`\`\`

Set this as your **Project instructions**, not a one-off message. This is the highest-leverage step in the whole playbook — you write it once, and it pays out after every meeting.

### Step 4: Capture the raw notes

Right after the meeting, paste or upload your raw notes into the Project — bullet points, half-sentences, whatever you scribbled during the call. Don't tidy them up first; that's the job you're about to hand off.

### Step 5: Decide the deliverable

Minutes and an action log work fine as a Word document you can paste straight into an email — no need for anything fancier. The one exception is reporting into a steering committee that expects a slide; that's the case worth a PowerPoint version, ideally built by a shared template Skill rather than reformatted by hand each time. See Step 17.

### Step 6: Run it

\`\`\`
From these notes, build the action log (owner, action, due date) and the
minutes, and give me both as a Word document.
\`\`\`

Compare this to Step 2. Same underlying question, completely different quality of answer — because of what you invested upstream.

### Step 7: Verify before you trust it

Treat the result like a first draft from someone who wasn't in the room — useful, but worth checking before it goes out. This is the part that actually matters: understanding *why* it assigned what it assigned.

\`\`\`
Show me which line in my notes each action item came from.
\`\`\`

\`\`\`
Which owners or deadlines did you have to guess at rather than read directly?
\`\`\`

If a guess is wrong, correct it — Claude will fix it rather than defend a wrong attribution, but only if you check.

### Step 8: Push back and drill down

\`\`\`
Which of these action items look most likely to slip, based on how they're worded?
\`\`\`

\`\`\`
Are any of these actions actually duplicates of something from a previous meeting?
\`\`\`

### Step 9: Use Claude as a sounding board, not just a doer

Instead of only issuing instructions, ask it to weigh in:

\`\`\`
Review this action log against how well-run steering committees typically
track follow-through. What's missing?
\`\`\`

\`\`\`
Where could "who does what by when" still be ambiguous in how these actions
are worded?
\`\`\`

This is often where the real value shows up — not in the first answer, but in what surfaces when you ask it to critique its own work.

### Step 10: Pull in outside context with web search

Less central here than in the other two playbooks, but useful occasionally — say explicitly when you want Claude to search:

\`\`\`
Search for how other logistics or shipping companies structure recurring
steering committee action logs, if there's a pattern worth adopting.
\`\`\`

### Step 11: Add a visual status summary

\`\`\`
Add a simple chart showing how many actions are open, in progress, or done,
compared with the last two meetings.
\`\`\`

Content first, polish second — get the log right before asking for a chart on top of it.

### Step 12: Reformat for a different audience

\`\`\`
Draft a short follow-up message I can send to the group with the minutes
and action log attached.
\`\`\`

Before your next meeting on the same topic, ask Claude to check what's outstanding from the last action log — that's your agenda starter.

### Step 13: Turn it into a Skill so it repeats itself

This is the payoff for everything above. Once the recipe works — instructions, notes format, output format, verification habit — package it so you never re-explain it again:

\`\`\`
Turn this into a Skill I can run after every meeting on this topic — same
instructions, same output, one command to kick it off.
\`\`\`

Skills work like the ones from the pre-session basics module: type \`/\` in a new chat and yours will be there.

### Step 14: Open and read the Agent SOP

When Claude builds you a Skill, it writes a procedure behind it — the **Agent SOP** — laying out exactly what the Skill checks, asks, and does each time it runs. Open it and read it, the way you'd read a colleague's checklist before trusting them to run something unsupervised.

\`\`\`
Open the SOP for this Skill and add a step that flags any action item
carried over unfinished from the previous meeting.
\`\`\`

The stronger the SOP, the more consistently the Skill performs — every time, without you in the room.

### Step 15: Make the Skill ask for what it's missing

A good Skill doesn't guess when something's missing — it asks:

\`\`\`
If I run this Skill without pasting in notes, have it ask me to provide
them before continuing.
\`\`\`

You can go further and have it interview you for anything the notes alone can't resolve:

\`\`\`
Before finishing, have the Skill ask me whether any flagged ambiguous-owner
actions should be assigned to someone specific, and fold my answer into the
final action log.
\`\`\`

That turns the Skill from a report generator into something closer to a structured interview: it does the mechanical write-up, then asks you for the judgment calls only a person can make.

### Step 16: Save, update, and share it

When Claude finishes building a Skill, it will typically offer you a save (and sometimes a download) option — take it. Once saved, it's there under \`/\` next time. To change it later, don't rebuild from scratch:

\`\`\`
Update my meeting notes Skill to also carry forward any action item that's
overdue from the previous meeting into this one's log.
\`\`\`

If your team is on a Team or Enterprise plan, a working Skill can usually be shared so colleagues use the same one instead of rebuilding it themselves.

### Step 17: Nest skills inside skills

A Skill doesn't have to solve every part of the problem itself — it can call another Skill as a step. If someone on the team has already built and refined a Skill that produces DFDS-branded slides, your meetings Skill doesn't need to solve formatting itself:

\`\`\`
When I need a steering committee slide, use the "DFDS PowerPoint" Skill to
build it — read its SKILL.md before starting so it matches DFDS's deck
standards.
\`\`\`

> **The moves that carry to any project — not just this one:**
>
> - Give Claude the recurring shape of the task, not just an isolated question
> - Name the audience and the exact format you want back
> - Verify the first answer before you trust it — ask *how* it got there
> - Don't stop at the first draft — drill in, push back
> - Ask for options, a best-practice review, or blind spots — not just instructions
> - Bring in outside context with web search when your files alone don't explain something
> - Add polish (visuals, formatting) only once the content is right
> - Once the recipe works, turn it into a Skill — then open and refine its SOP the same way you refined your original instructions
> - Build in questions for whatever the Skill can't know on its own
> - Share what works instead of leaving everyone to rebuild it
> - Let Skills call other Skills — a well-built narrow Skill becomes a building block, not something rebuilt every time
>
> **Specific to this one:** raw notes as the recurring input, an owner/action/due-date convention, and Word as the default output.`,
  },
}
