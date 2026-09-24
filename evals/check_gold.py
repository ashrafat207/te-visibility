"""Cross-check the gold labels against the deterministic rules, and print cases for a hand check.

Gold labels come from how each case was built; agents/matching.py comes from the matching rules.
They were written independently, so any disagreement is a bug in one of them.

Run: python evals/check_gold.py [--show N]
"""

from __future__ import annotations

import json
import random
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from agents.matching import Settings, build_facts, rule_status  # noqa: E402


def load(name: str) -> list[dict]:
    return [json.loads(l) for l in (ROOT / "evals" / "gold" / name).read_text(encoding="utf-8").splitlines()]


def facts_for(case: dict):
    s = Settings(as_of=date.fromisoformat(case["as_of"]), days_before=case["match_window"]["days_before"],
                 days_after=case["match_window"]["days_after"])
    facts = build_facts(case["trips"], case["card_transactions"], case["expense_reports"], s)
    tgt = case["target"]
    return next(f for f in facts if f.target_kind == tgt["kind"] and f.target_id == tgt["id"])


def main() -> int:
    problems = 0
    for case in load("recon_cases.jsonl"):
        exp = case["expected"]
        f = facts_for(case)
        status, _reason = rule_status(f)
        issues = []
        if status != exp["status"]:
            issues.append(f"status rules={status} gold={exp['status']}")
        if exp["amount_outstanding"] is not None and f.outstanding != Decimal(exp["amount_outstanding"]):
            issues.append(f"amount rules={f.outstanding} gold={exp['amount_outstanding']}")
        missing = set(exp["matched_ids"]) - set(f.matched_ids)
        if missing:
            issues.append(f"gold matched ids not found by rules: {sorted(missing)}")
        cite_pool = set(f.matched_ids) | {case["target"]["id"]}
        if not set(exp["must_cite"]) <= cite_pool:
            issues.append(f"must_cite outside candidates: {sorted(set(exp['must_cite']) - cite_pool)}")
        if issues:
            problems += 1
            print(f"MISMATCH {case['case_id']}: " + "; ".join(issues))

    for case in load("digest_cases.jsonl"):
        exp = case["expected"]
        total = sum((Decimal(t["amount"]) for t in exp["travelers"]), Decimal("0"))
        flagged = sum((Decimal(f["amount_outstanding"]) for f in case["flags"] if f["status"] != "fully_expensed"), Decimal("0"))
        if total != Decimal(exp["grand_total"]) or flagged != total:
            problems += 1
            print(f"MISMATCH {case['case_id']}: totals {total} / {exp['grand_total']} / {flagged}")

    print(f"{'OK' if not problems else 'FAILED'}: {problems} problem case(s)")

    if "--show" in sys.argv:
        n = int(sys.argv[sys.argv.index("--show") + 1])
        for case in random.Random(7).sample(load("recon_cases.jsonl"), n):
            print("\n---", case["case_id"], "|", case["description"])
            for t in case["trips"]:
                print(f"  trip {t['id']} {t['employee_id']} {t['start_date']} -> {t['end_date']}")
            covered = {l["card_transaction_id"]: r["status"] for r in case["expense_reports"] for l in r["lines"]}
            for c in case["card_transactions"]:
                print(f"  charge {c['id']} {c['employee_id']} {c['txn_date']} {c['amount']:>9} {c['merchant'][:40]:40} report={covered.get(c['id'], '-')}")
            e = case["expected"]
            print(f"  EXPECT {e['status']} amount={e['amount_outstanding']} cite={e['must_cite']}")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
