# T&E Visibility

A T&E visibility tool for strategic finance managers. It shows budget left today per team and cost centre, ties every expense to its trip, flags spend on the wrong cost centre, and lets the team test trip scenarios. Two Claude agents reconcile trips, card charges and expense reports behind it. Owner: Ashraf (product and build).

Current phase: PRD done, clickable prototype on seeded data, first user interviews. The code build (schema, data, matching, web app) is underway — see `README.md` for the status table.

## Where things live
- `context.md`: problem, ICP, jobs to be done, current phase. Read this first.
- `decisions.md`: dated decisions and why. Check it before proposing anything it already settled.
- `docs/`: snapshots of the living doc (PRD, Evals, Build plan, Pilot plan), taken 2026-09-28. The live version is https://claude.ai/code/artifact/e8d5a86f-f04d-48a5-b650-a15bc442679c. If the two disagree, ask which one wins.
- `evals/`: `eval-plan-v1.md` (what we run now) and `eval-lessons.md`, plus the working harness (`check_gold.py`, `gold/*.jsonl`).
- `discovery/`: interview guide, notes template, pain-points tracker, one notes file per interview.
- `prototype/interview-scope.md`: what the clickable prototype shows at interviews.
- `.claude/skills/`: project routines (see below).
- `agents/`, `data/`, `supabase/`, `web/`: the code — matching logic, the dummy-data generator, the database (schema, views, RLS), and the React app. See `README.md`.

@context.md
@decisions.md

## Rules for this project
- SQL does all the arithmetic. The model classifies and explains; it never computes amounts.
- Models: Reconciliation Agent on Claude Sonnet 5; Digest Agent and eval judge on Claude Haiku 4.5. The cost target is about $1.50 per full run or less. Don't switch models without an eval run on the starter set and a line in `decisions.md`.
- Evals put user satisfaction first. Run the five evals in `evals/eval-plan-v1.md` in priority order. Deterministic checks (amounts, schema, imports, audit log) are ordinary tests, not model evals.
- Nothing writes back to source systems. Every change in the app is logged: who, when, old value, new value.
- Dummy data only in this repo. Never commit real names, card numbers or company data, and never commit API keys (use `.env`, which is git-ignored).
- Pain points stay hypotheses until two or more interviews give recent, concrete examples.

## Routines (project skills)
- After a user interview: `/te-interview-synthesis` updates pain points, eval cases, lessons and decisions.
- Before an interview: `/te-interview-prep` checks the prototype scope and tailors the guide.
- After an eval run: `/te-eval-log` records the scorecard and the lessons.

## Writing style for project files
Short sentences, plain words, tables for anything compared. Date every log entry (YYYY-MM-DD). Quote users verbatim.
