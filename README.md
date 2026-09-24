# T&E Visibility Agent

Two Claude agents reconcile trips, corporate-card charges and expense reports, then publish a daily view of who has unexpensed spend. Amounts are computed in SQL; Claude classifies each trip and explains why.

> **Dummy data only.** Every name, trip and charge in this repo is generated. There is no real company, employee or card data here.

## Status

Prototype in progress. See the build plan for scope and order of work.

| Piece | Where | Status |
| --- | --- | --- |
| Database schema, row-level security | `supabase/` | Not started |
| Dummy data generator and gold set | `data/` | Not started |
| Reconciliation and Digest agents | `agents/` | Not started |
| Eval harness (8 metrics, release gates) | `evals/` | Not started |
| Web app (Home, Reconcile, Digest, Budget, Trips, Scenarios) | `web/` | Not started |

## Stack

- **Supabase**: Postgres, Auth, row-level security
- **Vercel**: React + Vite web app
- **GitHub Actions**: runs the agents (nightly and on demand) and the evals
- **Claude API**: Opus 5 for reconciliation, Sonnet 5 for the digest and eval judge

## Secrets

Never commit keys. Copy `.env.example` to `.env` for local work; `.env` is git-ignored. In CI, keys live in GitHub Actions secrets and Vercel environment variables.
