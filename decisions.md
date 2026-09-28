# Decisions log

Newest first. One entry per decision: what, why, what would change it.

## 2026-09-28: first interview shows the clickable prototype, not live agents
- **What:** show the Design canvas on seeded data, with agent output written in by hand from the gold set. Focus on stories 1, 2, 3 and 10.
- **Why:** 30 minutes to ship; the interview tests whether the problem and the view land, not whether the agent works.
- **Revisit when:** the problem is validated with 2 or 3 finance managers.

## 2026-09-28: eval plan v1, focused on user satisfaction
- **What:** 5 user-satisfaction evals on a 35-case starter set. Deterministic checks (amounts, schema, imports, audit) run as automated tests.
- **Why:** keep evals streamlined and tied to what the finance manager has to trust.
- **Revisit when:** the pilot starts; then move to the full 12-metric set.

## 2026-09-28: move off Opus 5
- **What:** Reconciliation Agent on Claude Sonnet 5 ($2 / $10 per MTok). Digest Agent and eval judge on Claude Haiku 4.5 ($1 / $5).
- **Why:** target was about $1.50 per full run. Opus 5 was about $4.50 (no caching). Sonnet 5 with caching is about $1.00 in real time and about $0.50 batched (approximate, 300 trips, 1,500 cached + 500 variable tokens in and 200 out per trip). SQL does the maths, so Opus's extra reasoning isn't where errors come from.
- **Pushback noted:** all-Haiku reconciliation saves only about $0.50 more per run, and wrong flags cost trust. Test Haiku on the starter set first.
- **Revisit when:** Haiku 4.5 hits the flag-agreement and recall targets on the starter set, or Sonnet misses them.
- **Source:** https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-09-28)
