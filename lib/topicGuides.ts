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
    subtitle: 'Turn raw notes or a Teams transcript into an action log and clean minutes.',
    content: `This is the full walkthrough for turning meeting notes — or a recording transcript — into minutes and an action log, from creating the Project through to turning it into a Skill you can run with one command. The pre-session gave you a taste; this is the real thing. And the real point of this guide isn't the exact prompts below — it's watching the output get better as you put more thought into what you ask for. That's the skill worth taking away: the more you invest in instructions, context and format, the more repeatable and higher-quality the result. Everything below is deliberately ordered to make that visible.

### Step 1: Create your Project

In the sidebar, click **Projects → New project**. Name it after the meeting series — e.g. "[Committee name] Notes" — so it's obvious which recurring meeting it belongs to. This is the one-time container everything else in this guide lives inside: your instructions, your notes, and every set of minutes you generate.

### Step 2: Capture the raw material — notes or a transcript

Right after the meeting, get something real into the Project. There are two ways to do this.

**Option A: Your own notes.** Paste or upload whatever you scribbled during the call — bullet points, half-sentences, whatever. Don't tidy them up first; that's the job you're about to hand off.

**Option B: A Teams recording transcript.** If the meeting was recorded in Microsoft Teams, the transcript is a far richer input than your own notes could ever be — it captures everything said, not just what you managed to jot down. To get it:

1. Open the meeting in Teams — from the calendar invite, or **Chat → the meeting thread**.
2. Find the recording and click **Open transcript** (the transcript icon sits next to it).
3. Click **Download** to save it as a Word document, or select all and copy the text straight out of the transcript panel.

Upload the transcript to the Project instead of — or alongside — your own notes.

One caution: transcripts are messy — cross-talk, filler words, and speaker labels that go wrong when someone's on a shared mic or hasn't renamed themselves. Tell Claude what it's dealing with once you fold this into Step 4:

\`\`\`
Sometimes I'll give you a raw Teams transcript instead of my own notes — it'll
include speaker labels, filler words, and cross-talk. Extract only what
matters: decisions, action items, and key discussion points, and ignore the
small talk.
\`\`\`

### Step 3: Start rough — see the ceiling

Try the laziest possible instruction against the notes or transcript you just added, so you have something to compare against later:

\`\`\`
Help me write up meeting notes.
\`\`\`

It'll produce *something* — but generic, even with real material to work from. Claude doesn't know whether you want minutes, an action log, or both, what "owner and deadline" convention you use, or how to handle a note that's ambiguous about who's responsible. It's guessing on every dimension at once. That's the ceiling of a lazy prompt, and it's low.

### Step 4: Turn it into instructions you'll reuse every time

Now give it what it was missing — the recurring shape of the output, a convention for owners and deadlines, and what to do when something's unclear:

\`\`\`
You're helping me turn raw meeting notes into two things: a clean set of
minutes, and an action log (owner, action, due date). Keep the tone
professional and concise. If a note is ambiguous about who owns an action,
flag it rather than guessing.
\`\`\`

Set this as your **Project instructions**, not a one-off message. This is the highest-leverage step in the whole playbook — you write it once, and it pays out after every meeting.

### Step 5: Load the Project with context beyond this meeting's notes

This is where the real leverage sits. Your notes or transcript only capture what happened in the room — they don't capture everything a good minute-taker actually knows. Add background material to the Project once, and every future meeting benefits from it automatically:

| Add this | Why it helps |
|---|---|
| The previous meeting's action log | Claude can carry forward unfinished items and tell "is this new, or a repeat?" |
| This meeting's agenda | Claude knows the expected structure, and can flag if an agenda item never actually got discussed |
| Steering committee material or pre-read decks | Background so shorthand in your notes ("the Q3 numbers", "the vendor issue") actually means something |
| Participant list with names and roles | Claude can map "Finance will look into it" to the actual accountable person, instead of guessing or leaving it blank |

A few more worth adding once you see the pattern:

- **A past set of minutes you're happy with**, as a style reference — Claude matches the tone and structure instead of inventing its own each time.
- **A glossary of recurring shorthand** — project codenames, acronyms, anything a newcomer to the room wouldn't follow.
- **The committee's terms of reference** — what this forum actually has authority to decide, so Claude can tell a real decision from "options were discussed."
- **A short org/reporting-lines note** — helps disambiguate ownership when a note names a team rather than a person.

Once you've added these, update your instructions to tell Claude to actually use them:

\`\`\`
Use the participant list to work out who's the likely owner when a note only
mentions a role or team, and check last meeting's action log for anything
that's carried over unresolved.
\`\`\`

### Step 6: Share the Project with your team

If note-taking duty rotates around the team, this step matters more than almost anything else in this guide. Share the Project itself — not just the eventual Skill — so whoever's turn it is works from the exact same instructions and the exact same context library: the participant list, the previous action log, the style reference, all of it. Skip this, and everyone quietly builds their own slightly different version, and the minutes stop being consistent from meeting to meeting.

If your team is on a Team or Enterprise plan, a Project can usually be shared the same way a Skill can — see Step 18 for the equivalent once you've built one.

### Step 7: Decide the deliverable

Minutes and an action log work fine as a Word document you can paste straight into an email — no need for anything fancier. The one exception is reporting into a steering committee that expects a slide; that's the case worth a PowerPoint version, ideally built by a shared template Skill rather than reformatted by hand each time.

### Step 8: Run it

\`\`\`
From these notes, build the action log (owner, action, due date) and the
minutes, and give me both as a Word document.
\`\`\`

Compare this to Step 3. Same underlying question, completely different quality of answer — because of what you invested upstream.

### Step 9: Verify before you trust it

Treat the result like a first draft from someone who wasn't in the room — useful, but worth checking before it goes out. This is the part that actually matters: understanding *why* it assigned what it assigned.

\`\`\`
Show me which line in my notes each action item came from.
\`\`\`

\`\`\`
Which owners did you assign based on my notes directly, versus inferred from
the participant list or someone's usual role?
\`\`\`

The second kind needs a closer look. Inferring someone's likely job is a bigger leap than reading an explicit assignment — don't let it slide just because it's plausible. If a guess is wrong, correct it; Claude will fix it rather than defend a wrong attribution, but only if you check.

### Step 10: Push back and drill down

\`\`\`
Which of these action items look most likely to slip, based on how they're worded?
\`\`\`

\`\`\`
Are any of these actions actually duplicates of something from a previous meeting?
\`\`\`

### Step 11: Use Claude as a sounding board, not just a doer

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

### Step 12: Pull in outside context with web search

Less central here than in the other two playbooks, but genuinely useful for one thing: grounding the minutes in what's happening outside the room. Say explicitly when you want Claude to search:

\`\`\`
Search for recent news relevant to any of the topics discussed in this
meeting, and add them as links in the minutes wherever relevant.
\`\`\`

That turns a plain internal record into one that also flags what's happening in the world connected to what was just discussed — useful for anyone reading the minutes later who wasn't in the room.

### Step 13: Add a visual status summary

\`\`\`
Add a simple chart showing how many actions are open, in progress, or done,
compared with the last two meetings.
\`\`\`

Content first, polish second — get the log right before asking for a chart on top of it.

### Step 14: Reformat for a different audience

\`\`\`
Draft a short follow-up message I can send to the group with the minutes
and action log attached.
\`\`\`

Before your next meeting on the same topic, ask Claude to check what's outstanding from the last action log — that's your agenda starter.

### Step 15: Turn it into a Skill so it repeats itself

This is the payoff for everything above. Once the recipe works — instructions, context library, notes format, output format, verification habit — package it so you never re-explain it again:

\`\`\`
Turn this into a Skill I can run after every meeting on this topic — same
instructions, same context, same output, one command to kick it off.
\`\`\`

Skills work like the ones from the pre-session basics module: type \`/\` in a new chat and yours will be there.

### Step 16: Open and read the Agent SOP

When Claude builds you a Skill, it writes a procedure behind it — the **Agent SOP** — laying out exactly what the Skill checks, asks, and does each time it runs. Open it and read it, the way you'd read a colleague's checklist before trusting them to run something unsupervised.

\`\`\`
Open the SOP for this Skill and add a step that flags any action item
carried over unfinished from the previous meeting.
\`\`\`

The stronger the SOP, the more consistently the Skill performs — every time, without you in the room.

### Step 17: Make the Skill ask for what it's missing

A good Skill doesn't guess when something's missing — it asks:

\`\`\`
If I run this Skill without pasting in notes or a transcript, have it ask me
to provide one before continuing.
\`\`\`

You can go further and have it interview you for anything the notes alone can't resolve:

\`\`\`
Before finishing, have the Skill ask me whether any flagged ambiguous-owner
actions should be assigned to someone specific, and fold my answer into the
final action log. If the participant list hasn't been touched in a couple of
months, have it check that's still accurate before relying on it.
\`\`\`

It should also flag when the substance itself is unclear, not just who owns it:

\`\`\`
If a decision or action item isn't fully clear from the notes or transcript —
the wording is ambiguous, or you're inferring what was actually agreed —
ask me to confirm what was decided before finalising the minutes, rather
than guessing.
\`\`\`

That turns the Skill from a report generator into something closer to a structured interview: it does the mechanical write-up, then asks you for the judgment calls only a person can make.

### Step 18: Save, update, and share it

When Claude finishes building a Skill, it will typically offer you a save (and sometimes a download) option — take it. Once saved, it's there under \`/\` next time. To change it later, don't rebuild from scratch:

\`\`\`
Update my meeting notes Skill to also carry forward any action item that's
overdue from the previous meeting into this one's log.
\`\`\`

If your team is on a Team or Enterprise plan, a working Skill can usually be shared so colleagues use the same one instead of rebuilding it themselves — the same idea as sharing the Project in Step 6, just for the finished recipe rather than the raw materials. Between the two, everyone taking a turn works from the same foundation and the same process.

> **The moves that carry to any project — not just this one:**
>
> - Give Claude the recurring shape of the task, not just an isolated question
> - Load background context beyond the immediate input — history, reference material, and who's involved, not just the raw notes
> - Share the Project itself, not just the eventual Skill, when the work rotates across a team
> - Name the audience and the exact format you want back
> - Verify the first answer before you trust it — ask *how* it got there
> - Don't stop at the first draft — drill in, push back
> - Ask for options, a best-practice review, or blind spots — not just instructions
> - Bring in outside context with web search when your files alone don't explain something
> - Add polish (visuals, formatting) only once the content is right
> - Once the recipe works, turn it into a Skill — then open and refine its SOP the same way you refined your original instructions
> - Build in questions for whatever the Skill can't know on its own — both who owns something and what was actually decided
> - Share what works instead of leaving everyone to rebuild it
>
> **Specific to this one:** raw notes or a Teams transcript as the recurring input, a growing library of context (previous action logs, agenda, pre-read material, participants and roles) shared across the team, an owner/action/due-date convention, and Word as the default output.`,
  },
}
