---
name: te-interview-synthesis
description: Turn a T&E Visibility user-interview notes file into updates to the project's pain points, eval cases, eval lessons and decisions log.
---

# T&E interview synthesis

Use after each T&E Visibility interview, once a notes file exists in `discovery/`.

## Steps
1. Read the new notes file, `discovery/pain-points.md` and `context.md`.
2. For each pain point P1–P5:
   - Add the notes file to its Evidence column if the user gave a recent, concrete example.
   - Update the average severity.
   - Set status: **validated** once 2 or more interviews give recent examples; **dropped** once 2 or more users don't recognise it.
3. Add any new pain point as P6, P7, and so on, with status hypothesis.
4. Prototype reactions:
   - Every flag or reason the user distrusted, or rated 3 or lower, becomes a new eval case. Log it in `evals/eval-lessons.md`.
   - Trust ratings for "budget left" feed eval #1; reason ratings feed eval #4.
5. If a pain point's status or severity changes enough to reorder P0 stories, add a dated entry to `decisions.md` and flag the PRD change for the doc.
6. Append the best 1–3 verbatim quotes to `context.md` under a "Voice of the user" heading.
7. Reply with: which pain points moved, the new eval cases, and any PRD change to make.

## Rules
- Quote users verbatim. Never paraphrase a quote into something stronger.
- A single mention stays a hypothesis.
- Never change the PRD doc without saying what changed and why.
