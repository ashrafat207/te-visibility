# PRD summary

Full PRD: the "PRD" tab of https://claude.ai/code/artifact/e8d5a86f-f04d-48a5-b650-a15bc442679c. This page is a quick reference, and the doc wins if they disagree.

**What it is:** a T&E visibility tool for strategic finance managers. It shows budget left today per team and cost centre, ties every expense to its trip and purpose, flags spend on the wrong cost centre, and lets the team test trip scenarios. Two Claude agents reconcile trips, card charges and expense reports behind it. SQL does all the arithmetic.

**Success:** about 2 hours back on a busy day, no month-end overspend surprises, numbers exact to the cent, a view never more than a day old.

## P0 stories (admin = finance manager, user = traveler)
1. Admin sees budget left today per team and cost centre.
2. Admin models scenarios: drop, move or resequence trips and see headroom.
3. Admin sees spend on the wrong cost centre flagged, with a suggested reallocation.
4. Admin sees every expense tied to its trip and purpose, with a status.
5. Amounts are exact to the cent.
6. User logs expenses in real time and sees what they have left.
7. Runs fail loudly rather than publish bad numbers.
8. No automated changes to source systems.
9. Spreadsheet imports: nothing lost or misread; column changes halt the import.
10. Full audit trail: who changed what, when, old and new value, and it can't be edited.

## Top risks
- Incorrect data: wrong figures in a sheet, double counting, timing gaps.
- Integration: renamed columns, several versions of one sheet, IDs that don't line up, sheet quirks, truncated exports.
- Unclear changes: sheet edits nobody notices, in-app edits with no owner, a tampered log.

## Model
Reconciliation on Claude Sonnet 5, digest and eval judge on Claude Haiku 4.5. About $1.00 per 300-trip run in real time, about $0.50 batched (see `decisions.md`).
