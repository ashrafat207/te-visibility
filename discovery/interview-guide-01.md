# Interview guide 01: strategic finance manager

**Length:** 30 min (cut section 4 if you only have 20).
**Goal:** find out whether our four pain points are real and painful enough, and whether the budget view, flags and scenarios are the right answer.
**Rule:** ask about the last real time something happened, not what they'd do in general. Show the prototype only after section 3.

## 1. Warm-up (3 min)
- What's your role, and which teams' T&E do you own?
- Roughly how many travelers, and how many expenses land in a typical month?

## 2. How it works today (8 min)
- Tell me about the last time someone asked how much T&E budget was left. What did you do, step by step?
- Which systems and spreadsheets did you open? Who owns each?
- How long did that take? How confident were you in the number?
- When did you last get a surprise at month end? What happened?

## 3. Probe each pain point (10 min)
Ask the open question first. Use the follow-up only if they don't raise it.

| Pain point | Open question | Follow-up |
| --- | --- | --- |
| No real-time view | When do you find out what was actually spent? | How far behind is that? What does the lag cost you? |
| Unclear what each expense was for | How do you work out what a charge was for? | When did that last go wrong? |
| Wrong cost centre ("shell game") | Have you seen spend booked to one cost centre and balanced out from another? | How do you spot it today? What happens next? |
| Spreadsheet changes nobody can trace | When a budget sheet changes, how do you know who changed what? | Has that caused a problem? |
| Scenario planning | When the budget gets tight, how do you decide which trips to drop or move? | What would help that conversation? |

For each one, note: happened recently? (Y/N), how often, workaround, cost in time or money.

## 4. Prototype walk-through (7 min)
Give them a task, then stay quiet and watch.
1. "Find how much is left for [team] this year." Time it. Ask them to rate their trust in the number from 1 to 5.
2. "Here's a flag. What would you do with it?" Ask them to rate the reason from 1 to 5: could you act on it without opening the source files? (This feeds eval #4.)
3. "You need to cut 15k. Use this to decide what to drop." Does the scenario answer their real question?
4. "Where would you look to see who changed this budget line?"

## 5. Wrap-up (2 min)
- If this worked perfectly, what would you stop doing?
- What would stop you from using it? (Data access, IT approval, trust.)
- Who else should we talk to? Can we come back with a live version on your own data?

## Capture straight after
Fill `interview-notes-template.md`, then run `/te-interview-synthesis` in Claude Code.
