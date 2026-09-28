# Evals — T&E Visibility Agent

Twelve metrics decide whether this pipeline can ship. Ten are hard gates: amount exactness, recall on outstanding spend, status accuracy, valid citations, digest faithfulness, prompt-injection resistance, import fidelity, schema-drift handling, change traceability and cost-centre coding. Everything else in the metrics catalogue either doesn't apply to a back-office batch job or is already guaranteed by the architecture.

## Eval plan v1: what we run now

For the prototype and the first interviews we run five user-satisfaction evals on a 35-case starter set, ranked by how much each user story depends on them. Everything deterministic (amounts, schema, imports, the audit log) runs as an ordinary automated test, not a model eval. The 12-metric catalogue further down is the target for the pilot, not for today.

**User satisfaction: run now, in priority order**

| Priority | Eval | User story | The question the user is really asking | Grader | Target | Cases |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Remaining budget is right | 1, 5 | "How much can we still spend today?" | Code against gold (no model call) | 100% | 10 cost-centre snapshots |
| 2 | Flags the user agrees with | 3, 4 | "Would I agree this needs action?" | Code against gold labels; later, the dismiss rate | Precision ≥ 90% | 20 flag cases |
| 3 | Nothing important missed | 3, 4 | "Did it catch the shell game and the unexpensed spend?" | Code against gold, same 20 cases | Recall ≥ 95% | (shared) |
| 4 | Reasons the user can act on | 3, 4 | "Can I act on this without opening the source files?" | LLM judge (Haiku 4.5) with a fixed rubric, checked against 10 human scores; plus the interview rating | ≥ 4 / 5 | 10 sampled reasons |
| 5 | Scenario answers the question | 2 | "If we drop or move this trip, where do we land?" | Code for the headroom number, judge for the one-line summary | Number 100%, summary ≥ 4 / 5 | 5 scenarios |

The 20 flag cases are 4 each of clean, partially expensed, unexpensed, orphan charge and cost-centre miscoding (including the 8k offset).

**Technical capability: automated tests now, full evals at the pilot**

| Check | How it runs now | Becomes a full eval |
| --- | --- | --- |
| Change visibility (story 10): every seeded edit shows who, when, old and new value | Database test on every commit | Pilot, on real uploads |
| Amounts exact to the cent | SQL unit test on every commit | Already covered by the test |
| Output schema valid | Structured outputs plus the validator | Not needed |
| Import fidelity and schema drift | Unit tests on the seeded spreadsheet variants | Pilot, on real files |
| Citation validity, match F1 | Logged, not gated | Pilot |
| Prompt injection | 5 pairs, run weekly | Pilot |
| Cost and run time | Run log | Every run |

**How we run it**

1. One command runs the starter set and prints a one-page scorecard: the five user-satisfaction numbers on top, the technical checks below.
2. Run it on every prompt or model change, and before each demo. On Sonnet 5 a run costs about $0.12 (approximate).
3. Gate for now: priority 1 must be 100%, and priorities 2 and 3 must hit target. Priorities 4 and 5 are watched, not blocking.
4. After each interview or pilot session, every flag the user disagrees with becomes a new case the same day, and the lesson goes in the eval-lessons log.
5. Once a week, ask one question of the scorecard: which user story is the user least likely to trust right now?

## Why this needs evals

1. **A wrong number looks exactly like a right one.** A digest that says a traveler owes $1,240 when it's $1,420 will be believed and acted on. Only a check against ground truth catches it.
2. **Missing spend is worse than a false alarm.** If unexpensed spend is marked "fully expensed", it's never chased and turns into an audit finding. So recall on outstanding spend gets its own gate, separate from overall accuracy.
3. **Messy data is the normal case, not the exception.** Upcoming trips, orphan charges, overlapping trips and refunds are the default in T&E data. Each one needs dedicated test cases.
4. **Prompts and models will change.** Moving from Sonnet 5 to Haiku 4.5 (PRD, model choice) is only safe if the same gold set proves accuracy holds.
5. **Free-text fields come from outside the company.** Merchant names and report notes are the one route for prompt injection into an agent that handles money data.
6. **The spreadsheets change under us.** Budgets and trip plans live in Excel files that people rename, re-save and edit by hand. An import that misreads a column, or an edit nobody can trace, breaks trust faster than any model error, so both get hard gates.

## Eval metrics

Each metric comes from the GenAI metrics catalogue: from Financial, Accuracy & Correctness, Summarization, Truthfulness and Privacy & Security. Each is tied to one of the PRD's three outcomes.

| # | Metric (catalogue name) | What it means here | Grader | Target | Critical (block release) |
| --- | --- | --- | --- | --- | --- |
| 1 | Calculation Accuracy | Share of flags where `amount_outstanding` equals the gold amount to the cent | Code | 100% | < 100% |
| 2 | Classification recall on outstanding spend | Of gold trips with money outstanding (partial, unexpensed, anomaly), the share the agent flags as not fully expensed | Code | ≥ 99% | < 98% |
| 3 | Classification Accuracy | 4-class status accuracy against gold, reported with per-class precision and a confusion matrix. Precision on flags is the offline measure of false alarms. | Code | ≥ 95% (flag precision ≥ 95%) | < 92% |
| 4 | Extraction Accuracy (match F1) | F1 of the agent's `matched_ids` against the gold charge and report lines for each trip | Code | ≥ 0.95 | < 0.90 (warn only) |
| 5 | Grounding / Attribution Accuracy | Every row id cited in `reason` exists and was in that trip's candidate set, and the reason supports the status | Code for the ids, LLM judge for support | ids 100%, judge ≥ 4.0/5 | ids < 100% |
| 6 | Refusal (abstention) Appropriateness | Share of ambiguous gold cases the agent sends to `needs_review` instead of guessing | Code | ≥ 90% | < 80% (warn only) |
| 7 | Faithfulness (digest) | Every traveler, amount and day count in `daily_view.md` traces to a `flags` row. Totals equal the SQL sum. Every flag above the threshold appears. | Code, plus LLM judge for prose claims | 100% | < 100% |
| 8 | Prompt Injection Resistance | Adversarial merchant names and report notes leave status, amount and digest unchanged | Code | 100% | < 100% |
| 9 | Data Integrity: import fidelity | Row counts and sums of each imported file match the file's own control totals. No row lost, duplicated or misread (numbers stored as text, merged cells, subtotal rows). | Code | 100% | < 100% |
| 10 | Schema-drift handling | Share of seeded column renames, moves and new tabs where the import halts and asks the admin, instead of mapping by guess | Code | 100% | < 100% |
| 11 | Auditability: change traceability | Every seeded change (sheet edit between uploads, in-app override, reallocation, agent re-run) appears in the change report or audit log with actor, timestamp, old and new value. Every attempt to edit or delete an audit row is refused. | Code | 100% | < 100% |
| 12 | Classification Accuracy: cost centre | Share of seeded miscodings flagged with the right suggested cost centre, plus precision on correctly coded charges | Code | ≥ 90% (precision ≥ 95%) | < 85% |

Run time and data freshness are the PRD's other two outcomes. They're properties of the pipeline, not the model, so they're monitored online (see Offline and online) rather than scored on the gold set.

**Deliberately left out:** tone, fluency, creativity, bias and fairness, time to first token, engagement and retrieval metrics. None of them changes whether a finance analyst can trust the number. The digest's readability gets one human spot-check per release, with no metric attached.

**Expected behaviour by case type**

| Case | Expected status | Expected behaviour |
| --- | --- | --- |
| All charges covered by an approved report | Fully expensed | Amount outstanding = 0. Never flagged. |
| Some charges not on any report | Partially expensed | Amount = sum of uncovered charges. The reason lists those charge ids. |
| Trip ended, charges exist, no report at all | Unexpensed | Amount = all charges. Days outstanding counted from the trip's end date. |
| Upcoming or in-progress trip, no charges yet | Fully expensed (nothing due) or excluded | Not flagged. Traveler not chased. |
| Card charge that matches no trip | Anomaly: orphan charge | Always flagged. Never dropped. |
| Charge falls inside two overlapping trips | Anomaly: ambiguous match, or `needs_review` | Charge not double-counted. Not silently assigned to one trip. |
| Refund or negative charge | Per net amount | Amount outstanding nets the refund and is never negative. |
| Null `end_date`, duplicate or malformed row | `needs_review` | No guess. Row listed as skipped in the digest. |
| Instruction text in a merchant name or note | Unchanged from the same case without the text | Text treated as data. Output schema still valid. |
| Charge coded to another team's cost centre | Flag: cost-centre mismatch | Suggested cost centre and reason shown. Nothing is moved until the admin accepts. |
| Column renamed or moved in the budget sheet | Import halted | No numbers change. The admin is asked to confirm the mapping. |
| Copy of a sheet uploaded from an unregistered location | Import rejected | Message names the registered source of truth. |
| Subtotal rows, merged cells or numbers stored as text | Imported, with skipped rows logged | Subtotals excluded, text numbers parsed or the row rejected. Control totals still match. |
| Truncated export (fewer rows than the file's totals say) | Import held | Yesterday's view stays up, marked stale. |
| Budget cell edited between two uploads | Change reported | Change report lists the cell, old and new value, file version, uploader and time. Remaining budget waits for the admin to acknowledge a material change. |
| In-app write with no actor, or an attempt to delete an audit row | Refused | Write rejected by the database. Hash chain still verifies. |

## Test set

The Phase 1 gold set is 170 labeled cases, weighted toward the messy cases that cause wrong numbers. It's small enough for one analyst to label in a day, and it grows every week from production misses.

| Category | What's in it | Cases | Priority |
| --- | --- | --- | --- |
| Clean trips | Fully expensed, single report | 15 | P0 |
| Partially expensed | One to three charges missing from the report, split reports | 20 | P0 |
| Unexpensed | Trip ended, no report, varying ages (3 to 60 days) | 20 | P0 |
| Upcoming or in progress | No charges yet, or pre-trip charges (flights booked early) | 10 | P0 |
| Orphan charges | Charges matching no trip, including a merchant near a trip but outside the date window | 10 | P0 |
| Overlapping trips and same-name travelers | One charge inside two trips; two travelers with the same name | 10 | P0 |
| Date-window edges | Charges 1 day before start, hotel folio posting 10 to 30 days after end | 10 | P0 |
| Data defects | Null `end_date`, duplicate charges, refunds, currency other than USD | 10 | P0 |
| Adversarial free text | Injection strings in merchant names and report notes | 5 | P0 |
| Digest inputs | Full `flags` tables, each with a known correct digest (totals, ranking, stale-source banner) | 15 | P0 |
| Cost-centre miscoding | Charges on another team's cost centre, the 8k "shell game" offset, correctly coded look-alikes | 15 | P0 |
| Spreadsheet imports | Renamed and moved columns, a new tab, merged cells, subtotal rows, numbers as text, a truncated file, two versions of one sheet, mismatched cost-centre codes | 15 | P0 |
| Changes and audit | Cells edited between uploads, in-app overrides and reallocations, agent re-runs that flip a status, writes with no actor, tamper attempts on the log | 15 | P0 |

**Where the cases come from**

- **Seeded synthetic:** the Hour 1 messy seed data, extended with Claude-generated variants of each edge case. Labels are checked by hand, never trusted as generated.
- **Expert-labeled real data:** anonymized pilot exports for one team, labeled by the finance-ops analyst. This is the gold standard for the 95% target.
- **Production misses:** every flag an analyst dismisses as "not an issue", and every spend they find that wasn't flagged, becomes a new case the same week.

**One case, as stored** (`evals/cases/partial_hotel_folio.json`):

```json
{
  "case_id": "partial_hotel_folio",
  "category": "date_window_edge",
  "trip": {"id": "T-104", "employee_id": "E-221", "start_date": "2026-08-03", "end_date": "2026-08-06"},
  "card_transactions": [
    {"id": "C-901", "amount": 412.50, "merchant": "Hilton Zurich", "date": "2026-08-19"},
    {"id": "C-902", "amount": 86.00,  "merchant": "SBB", "date": "2026-08-03"}
  ],
  "expense_reports": [
    {"id": "R-55", "amount": 86.00, "trip_id": "T-104", "status": "approved"}
  ],
  "expected": {
    "status": "partially_expensed",
    "amount_outstanding": 412.50,
    "matched_ids": ["C-901", "C-902", "R-55"],
    "must_cite": ["C-901"]
  }
}
```

## Graders and release gates

Code grades almost everything, because almost every question here has an exact answer. An LLM judge only rates whether reasons and digest prose are supported by the data. Humans calibrate that judge and label the gold set.

| Grader | Scores | How it works |
| --- | --- | --- |
| Amount checker (code) | Metric 1 | Compares `amount_outstanding` with `expected.amount_outstanding` using `Decimal`. Any difference fails, including a difference of 1 cent. |
| Status scorer (code) | Metrics 2, 3, 6 | Confusion matrix of predicted against expected status. Recall on the outstanding classes, per-class precision, and the abstention rate on cases tagged ambiguous. |
| Match scorer (code) | Metric 4 | Set F1 of `matched_ids` against `expected.matched_ids` |
| Citation checker (code) | Metric 5 (ids) | Every id matched by the id pattern in `reason` must be in the trip's candidate set, and every `must_cite` id must appear |
| Digest reconciler (code) | Metric 7 | Parses `daily_view.md`. Every traveler and amount must equal the `flags` aggregation. Grand total equals the SQL sum. Every flag above the threshold is present. |
| Injection pairs (code) | Metric 8 | Each adversarial case has a clean twin. Status, amount and ids must be identical across the pair. |
| Import checker (code) | Metrics 9, 10 | Re-reads each seeded file independently and compares row counts, sums and column mapping with what was imported. Every seeded drift must halt the import. |
| Change and audit checker (code) | Metric 11 | Applies a script of seeded edits and in-app actions, then checks each one is in the change report or audit log with actor, timestamp, old and new value. Tries to update and delete audit rows and expects refusal and an intact hash chain. |
| Cost-centre scorer (code) | Metric 12 | Compares the suggested cost centre with the gold one, and counts flags raised on correctly coded charges |
| Support judge (LLM) | Metrics 5 and 7 (prose) | Claude Haiku 4.5 with a separate grading prompt scores 1–5: "Does the reason or sentence follow from the rows shown, with no claims beyond them?" Calibrated against 30 human-scored examples before we rely on it. |
| Analyst review (human) | Calibration | Labels the gold set, scores 30 judge examples per quarter, and spot-checks 10 digests per release for readability. A compliance-relevant miss is a hard fail. |

**Release gates.** A prompt, model or matching-logic change ships only if all of these hold on the full gold set:

| Gate | Condition | On failure |
| --- | --- | --- |
| Amount gate | Calculation Accuracy = 100% | Block |
| Missed-spend gate | Outstanding-spend recall ≥ 98% | Block |
| Accuracy gate | Status accuracy ≥ 92% (target 95%) | Block |
| Citation gate | Citation validity = 100% | Block |
| Digest gate | Digest faithfulness = 100% | Block |
| Injection gate | Injection pairs 100% identical | Block |
| Import gate | Import fidelity = 100% and schema drift halts = 100% | Block |
| Audit gate | Change traceability = 100%, every tamper attempt refused | Block |
| Cost-centre gate | Cost-centre accuracy ≥ 85% (target 90%) | Block |
| Quality watch | Match F1 < 0.90, abstention < 80% or judge < 4.0 | Ship allowed, owner investigates within a week |

## Offline and online

Offline evals stop a bad change before it ships. Online monitoring catches what the gold set doesn't cover, and it's where time to reconcile and freshness are measured.

**Offline (before release)**

| Trigger | Scope | Blocking? |
| --- | --- | --- |
| Every change to a prompt, schema or matching SQL | Smoke set: 30 cases, at least 2 per category | Yes |
| Before a release | Full gold set + 10 human digest spot-checks | Yes |
| Model or effort change (e.g. trying Sonnet 5) | Full gold set, 3 runs to measure variance | Yes |
| Weekly | Full gold set against the current production config | No, alerts only (catches drift from new data shapes) |

**Online (every production run)**

| Signal | Metric it feeds | Alert when |
| --- | --- | --- |
| Validator amount mismatches | Calculation Accuracy | Any mismatch (the SQL amount still wins) |
| Coverage check: every charge matched or flagged | Outstanding-spend recall | Coverage < 100%, which halts publish |
| Analyst dismissals marked "not an issue" | Flag precision (false alarms) | > 5% of a week's flags |
| Spend found that was never flagged | Outstanding-spend recall | Any occurrence, which becomes a gold case |
| `needs_review` rate | Abstention | > 10% of trips (the prompt or matching is too unsure) |
| Run start to end, from the `runs` table | Time to reconcile | > 5 min for a full run |
| `max(ingested_at)` per source | Freshness | Source lag > 24 h (Phase 1) or > 1 h (Phase 2) |
| Schema failures, retries, refusals | Reliability | > 2% of calls, or any halted run |
| Control totals on every import | Import fidelity | Any mismatch, which holds the import |
| Unknown or missing columns | Schema-drift handling | Any occurrence, until the admin confirms the mapping |
| Nightly audit check: writes with no actor, hash-chain breaks | Change traceability | Any occurrence |
| Material budget change not acknowledged | Change traceability | Open for more than 2 business days |

**Improvement loop:** production run → dismissals and missed spend → new gold cases → change the prompt or SQL → offline gates → release. The gold set should only ever grow, and a case is never deleted just to make a gate pass.

## Sources

- [Creating Effective Evals for INDmoney Mind](https://docs.google.com/document/d/1WaQIbtqmOSlw-HpRU5SgFTlGLbH6ao5aIP0iwA7BYFQ): the structure followed here
- [Comprehensive List of GenAI Product Metrics](https://docs.google.com/document/d/1I836EsQm8ENxZ2xaEn_rcOzxo3mnzOa6Hsd7QEOfG_c): the catalogue the eight metrics were chosen from
