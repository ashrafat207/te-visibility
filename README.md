# T&E Visibility Agent

Two Claude agents reconcile trips, corporate-card charges and expense reports, then publish a daily view of who has unexpensed spend. Amounts are computed in SQL; Claude classifies each trip and explains why.

> **Dummy data only.** Every name, trip and charge in this repo is generated. There is no real company, employee or card data here.

## Status

Prototype in progress. See the build plan for scope and order of work.

| Piece | Where | Status |
| --- | --- | --- |
| Database schema, row-level security | `supabase/` | Written, not yet applied |
| Dummy data generator and gold set | `data/`, `evals/gold/` | Done: 110 reconciliation + 15 digest cases |
| Deterministic matching (also the free mock mode) | `agents/matching.py` | Done |
| Reconciliation and Digest agents | `agents/` | Not started |
| Eval harness (8 metrics, release gates) | `evals/` | Not started |
| Web app (Home, Reconcile, Digest, Budget, Trips, Scenarios) | `web/` | Not started |

## Stack

- **Supabase**: Postgres, Auth, row-level security
- **Vercel**: React + Vite web app
- **GitHub Actions**: runs the agents (nightly and on demand) and the evals
- **Claude API**: Opus 5 for reconciliation, Sonnet 5 for the digest and eval judge

## Data and checks

```bash
python data/generate.py        # rebuilds supabase/seed.sql and evals/gold/*.jsonl (same bytes every run)
python evals/check_gold.py     # gold labels vs the matching rules; any mismatch is a bug in one of them
```

Gold labels come from how each case is built, not from running the matching code, so the eval tests that code instead of agreeing with it.

## Secrets

Never commit keys. Copy `.env.example` to `.env` for local work; `.env` is git-ignored. In CI, keys live in GitHub Actions secrets and Vercel environment variables.
