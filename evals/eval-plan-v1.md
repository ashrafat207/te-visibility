# Eval plan v1

Full version: "Eval plan v1" at the top of the Evals tab in the doc. The 12-metric catalogue there is the target for the pilot.

## User satisfaction: run now, in priority order
| # | Eval | Story | The user's question | Grader | Target | Cases |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Remaining budget is right | 1, 5 | How much can we still spend today? | Code vs gold | 100% | 10 snapshots |
| 2 | Flags the user agrees with | 3, 4 | Would I agree this needs action? | Code vs gold | Precision ≥ 90% | 20 flag cases |
| 3 | Nothing important missed | 3, 4 | Did it catch the shell game and the unexpensed spend? | Code vs gold | Recall ≥ 95% | same 20 |
| 4 | Reasons the user can act on | 3, 4 | Can I act without opening the source files? | Haiku 4.5 judge + human check | ≥ 4 / 5 | 10 sampled |
| 5 | Scenario answers the question | 2 | If we drop or move this trip, where do we land? | Code + judge | 100% / ≥ 4 of 5 | 5 |

The 20 flag cases are 4 each of: clean, partially expensed, unexpensed, orphan charge, and cost-centre miscoding (including the 8k offset).

## Technical capability: automated tests now
Change visibility (story 10), amounts to the cent, schema validity, import fidelity and drift, citation validity and match F1, prompt injection, cost and run time.

## How we run it
1. One command → a one-page scorecard (user metrics on top).
2. Run it on every prompt or model change, and before demos (about $0.12 per run).
3. Gate: #1 = 100%, and #2 and #3 at target. #4 and #5 are watched, not blocking.
4. Every flag a user disagrees with becomes a case the same day, and the lesson goes in `eval-lessons.md`.
5. Weekly: which story is the user least likely to trust?
