# T&E Visibility Agent

Two Claude agents reconcile trips, corporate-card charges and expense reports, then publish a daily view of who has unexpensed spend. Amounts are computed in SQL; Claude classifies each trip and explains why.

> **Dummy data only.** Every name, trip and charge in this repo is generated. There is no real company, employee or card data here.

## Planning and product docs

Product and discovery material lives alongside the code: `CLAUDE.md` (start here for project rules and a map), `context.md` (problem, ICP, jobs to be done), `decisions.md` (dated decisions log), `docs/` (PRD, PRD summary, build plan, evals, pilot plan), `discovery/` (interview guide, notes, pain points) and `prototype/interview-scope.md`. `.claude/skills/` has the interview and eval-logging routines.

## Status

Prototype in progress. See the build plan for scope and order of work.

| Piece | Where | Status |
| --- | --- | --- |
| Database schema, views, row-level security | `supabase/` | Applied to the live Supabase project and seeded with the dummy org |
| Dummy data generator and gold set | `data/`, `evals/gold/` | Done: 110 reconciliation + 15 digest cases |
| Deterministic matching (also the free mock mode) | `agents/matching.py` | Done |
| Reconciliation and Digest agents | `agents/` | Not started |
| Eval harness (12 metrics, release gates) | `evals/` | Not started (`check_gold.py` runs today; the harness in `docs/evals.md` is next) |
| Web app (Home, Budget, Trips, Reconcile, Digest, Scenarios) | `web/` | Scaffolded: React + Vite + TS, Supabase Auth (magic link) and RLS-aware queries against the live project. Not deployed. |

## Stack

- **Supabase**: Postgres, Auth, row-level security
- **Vercel**: React + Vite web app
- **GitHub Actions**: runs the agents (nightly and on demand) and the evals
- **Claude API**: Sonnet 5 for reconciliation, Haiku 4.5 for the digest and eval judge (see `decisions.md`)

## Data and checks

```bash
python data/generate.py        # rebuilds supabase/seed.sql and evals/gold/*.jsonl (same bytes every run)
python evals/check_gold.py     # gold labels vs the matching rules; any mismatch is a bug in one of them
```

Gold labels come from how each case is built, not from running the matching code, so the eval tests that code instead of agreeing with it.

## Web app

```bash
cd web
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase dashboard -> Project Settings -> API)
npm install
npm run dev
```

Six screens (Home, Budget, Trips, Reconcile, Digest, Scenarios), all reading Supabase views through the browser's publishable key — row-level security decides what each signed-in role sees. Sign-in is a Supabase magic link; a brand-new sign-in becomes a read-only `viewer` until an admin promotes it in `app_users`. Reconcile and Digest show an empty state until the agents in `agents/` are built. To deploy: Vercel project rooted at `web/`, framework Vite, with the same two env vars.

## Secrets

Never commit keys. Copy `.env.example` to `.env` for local work; `.env` is git-ignored. In CI, keys live in GitHub Actions secrets and Vercel environment variables.
