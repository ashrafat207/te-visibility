---
name: te-eval-log
description: Record a T&E Visibility eval run - the scorecard, what failed and why, new cases and changes - in evals/eval-lessons.md, and flag any decision it triggers.
---

# T&E eval log

Use after running the eval starter set (or the full gold set) for T&E Visibility.

## Steps
1. Get the scorecard: from the run output if it's in the repo, otherwise ask for the five numbers.
2. Compare with the gates in `evals/eval-plan-v1.md`:
   - #1 remaining budget = 100%
   - #2 flag precision ≥ 90%
   - #3 recall ≥ 95%
   - #4 reason usefulness ≥ 4 / 5 (watched)
   - #5 scenario answer: number 100%, summary ≥ 4 / 5 (watched)
3. For each miss, name the likely root cause: prompt, data, SQL, rubric, or our assumption about the user. Point to the failing case ids.
4. Add a dated entry at the top of `evals/eval-lessons.md` using its template.
5. If the run was a model or effort comparison, add an entry to `decisions.md` with the result and the cost per run.
6. Reply with: pass or fail on the gates, the top miss and its cause, and the next change to try.

## Rules
- Never delete or edit a gold case to make a gate pass.
- Report cost per run next to the scores, so model trade-offs stay visible.
