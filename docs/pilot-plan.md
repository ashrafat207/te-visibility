# Pilot plan — ship to real users

Sep 28, 2026 · @Ashraf Abu Talib

Take the dummy-data prototype to a live pilot with one finance manager's team, on their real spreadsheets and feeds, over 10 weeks: 2 to harden, 2 in shadow mode beside their spreadsheet, 4 live with stress tests, 2 to review. It widens to all travelers only if the eval gates hold on real data and the finance manager stops keeping the old spreadsheet.

## Roadmap

```
Harden (wk 1-2) --[Gate 1: pilot-ready]--> Shadow run (wk 3-4) --[Gate 2: numbers match]--> Live pilot (wk 5-8) --[Gate 3: go / no-go]--> Review (wk 9-10)

Gate 1: all release gates pass; data handling signed off; backup restore tested
Gate 2: every amount gap explained; import fidelity 100%; status accuracy >= 95%
Gate 3: gates held for 4 weeks; no month-end surprise; old spreadsheet retired
```

Each gate is a hard stop. If a gate fails, we stay in the current phase, fix the cause through the eval gates, and re-check. We never skip ahead.

## Who's in the pilot

One finance manager and one travelling team: small enough to fix things weekly, big enough to hit real month-end and cost-centre problems.

| Role | Who | Time we ask for |
| --- | --- | --- |
| Strategic finance manager (admin, the ICP) | 1 | 30-min weekly check-in. Uses the view for budget decisions from week 5. |
| Finance-ops analyst | 1 | 15 min a day reviewing flags. Labels 50 real trips for the gold set in weeks 3–4. |
| Travelers and team members (users) | One team, about 20 | 15-min onboarding. Log expenses as they happen. |
| Team lead | 1–2 | Reads the team roll-up. One feedback call. |
| Controller | 1 | Reviews the audit log weekly. Signs off gates 1 and 3. |
| Product and build | @Ashraf Abu Talib | Runs the check-ins, ships fixes weekly through the eval gates, owns the go / no-go write-up |

## Phase by phase

**1. Harden (weeks 1–2): from prototype to pilot-ready.** Everything in the Build plan's prototype column, plus what real data needs.

- [ ] Separate staging and production Supabase projects, with daily backups and point-in-time recovery
- [ ] Sign-in limited to the pilot company's email domain. Roles (admin, analyst, user, controller) tested against row-level security.
- [ ] Register the pilot's real sources (budget sheet, trip plan, card feed, expense export) and save each column mapping with the finance manager
- [ ] Audit log and change report live, with the nightly hash-chain check
- [ ] Data handling agreed: what goes to the model API, retention and region. No card numbers stored.
- [ ] Monitoring: error alerts, run log, cost alert, and a kill switch that pauses the agents
- [ ] Full gold set passes every release gate
- [ ] A 15-min onboarding script and a one-page "how to report a wrong number"

**2. Shadow run (weeks 3–4): run beside the spreadsheet; no decisions made from it yet.**

- [ ] Daily: import the real files, run reconciliation, compare remaining budget per cost centre with the manager's spreadsheet
- [ ] Log every difference with its cause: our bug, an error in their sheet, or timing
- [ ] Turn every miss into a gold case the same week
- [ ] Analyst labels 50 real trips as the real-data gold set

**3. Live pilot (weeks 5–8): the manager uses it as the main view.**

- [ ] Week 5: onboard the travelers in one 15-min session
- [ ] Weekly 30-min check-in: what did you decide with it, and what did you still double-check in the old sheet?
- [ ] "This looks wrong" button in the app, triaged within 1 business day
- [ ] One release a week, only through the eval gates
- [ ] Run the stress tests below on schedule

**4. Review (weeks 9–10): decide go, iterate or stop** against the criteria below, and write it up for the controller and the finance manager.

## Stress tests

Each test targets one of the PRD's risks, agreed with the finance manager in advance. Tests that plant bad data run on staging, using a copy of the pilot data if data handling allows, otherwise synthetic data.

| # | Test | How we run it | Passes when | Where, when |
| --- | --- | --- | --- | --- |
| 1 | Month-end close | Run through a real month end, with late hotel folios and the card cut-off | Remaining budget matches the closed month to the cent, or every gap is a named timing difference | Production, whichever week month end falls |
| 2 | Budget revised mid-month | The manager edits the budget sheet and re-uploads it | Every changed cell is in the change report with who and when. Remaining budget moves only after they acknowledge it. | Production, week 5 |
| 3 | Sheet restructured | Rename and move columns in a copy, then upload it | Import halts and asks. Nothing changes until the mapping is confirmed. | Staging, week 6 |
| 4 | Wrong file | Upload an older version and a desktop copy | Both rejected, with a message naming the registered source | Staging, week 6 |
| 5 | Shell-game replay | Plant an 8k charge on the wrong cost centre and an offsetting move from another team | Both flagged with the suggested cost centre. The accepted reallocation shows in the audit log. | Staging, week 6 |
| 6 | Busy week | 3× the usual charges and logged expenses | Full run under 5 min. No double counts. | Staging, week 7 |
| 7 | Late or broken feed | Skip a day's card file, then send a truncated one | Stale banner shows. The import is held and yesterday's view stays. | Staging, week 7 |
| 8 | Two people edit at once | Two admins override the same flag within seconds | Both edits are in the audit log in order, and none is lost silently | Production, week 7 |
| 9 | Access boundaries | A traveler opens another team's budget; an admin tries to delete an audit row | Both refused, and the attempts are logged | Production, week 8 |
| 10 | Model outage | Block the model API during a nightly run | Run halts cleanly, the view is marked stale, and the next run recovers | Staging, week 8 |

## What we measure and the go / no-go call

The pilot measures the PRD's targets on real data, plus one adoption question: is the finance manager still keeping the old spreadsheet?

| Measure | Pilot target | Where it comes from |
| --- | --- | --- |
| Remaining budget accuracy | 100% to the cent, or explained | Daily comparison with the spreadsheet, then SQL recomputation |
| Month-end surprise | 0 | Month-end close vs the view on the last business day |
| Time saved | About 2 h back on a busy day | Before-and-after time study, plus the weekly check-in |
| False alarms | ≤ 5% of flags | Dismiss reasons on flags |
| Import fidelity and change traceability | 100% | Import control totals, nightly audit check |
| Manager adoption | Uses it 3+ days a week and stops updating the old sheet | Sign-in log and the weekly check-in |
| Traveler adoption | Most of the team logs at least one expense in the app | Quick-log records |

**Go / no-go at week 10**

| Call | When |
| --- | --- |
| Go: widen to all \~200 travelers (PRD Phase 2) | Release gates held on real data for 4 weeks. Zero unexplained amount gaps and no month-end surprise. The manager retired the old sheet. The controller signs off the audit trail. |
| Iterate: 4 more weeks | Numbers hold, but adoption is low or false alarms sit between 5% and 10% |
| Stop or rethink | A wrong number reached a real decision unexplained, or the manager still needs the spreadsheet to trust the view |

## Risks to the pilot, and what's waiting on you

| Risk | Fallback |
| --- | --- |
| Data approval takes longer than the 2 hardening weeks | Start the shadow run on the exports the manager already shares internally, and keep synthetic data for the stress tests |
| Travelers don't log expenses | The budget view still works from card and expense data. Logging is measured on its own, not a gate. |
| The finance manager has no time for check-ins | Switch to a 5-question weekly form |
| Two sources of truth drag on | The shadow run ends at gate 2, on a fixed date agreed up front |

**Waiting on you before week 1:**

- [ ] Pick the pilot finance manager and their team
- [ ] Get the data-handling answer: which data can go to a hosted model API, and in which region
- [ ] List the spreadsheets in play, their owners and where they live (the PRD's open questions)
- [ ] Agree the gate sign-offs: who signs gates 1 and 3 on the finance side
