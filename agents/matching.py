"""Deterministic matching and money math. No model involved.

The same rules as the SQL views in supabase/migrations/..._views.sql, in Python so the pipeline and
the evals share one implementation. tests/test_sql_parity (run against a live database) checks that
this module and the views agree on the demo data.

Every amount is a Decimal. The model never produces a number that reaches the flags table.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

ZERO = Decimal("0")
COUNTED_REPORT_STATUSES = {"submitted", "approved"}


@dataclass
class Settings:
    as_of: date
    days_before: int = 45
    days_after: int = 30


@dataclass
class Facts:
    """Everything the agent is told about one target (a trip, or an orphan charge)."""
    target_kind: str                      # "trip" | "charge"
    target_id: str
    employee_id: str
    candidates: list[dict] = field(default_factory=list)      # charges matched to this trip
    covered_ids: set[str] = field(default_factory=set)
    reports: list[dict] = field(default_factory=list)          # reports touching this trip or its charges
    ambiguous_ids: list[str] = field(default_factory=list)     # charges that fit more than one trip
    duplicate_ids: list[str] = field(default_factory=list)
    missing_end_date: bool = False
    upcoming: bool = False
    days_since_end: int | None = None

    @property
    def uncovered(self) -> list[dict]:
        return [c for c in self.candidates if c["id"] not in self.covered_ids]

    @property
    def outstanding(self) -> Decimal:
        return max(sum((Decimal(c["amount"]) for c in self.uncovered), ZERO), ZERO)

    @property
    def matched_ids(self) -> list[str]:
        return sorted([c["id"] for c in self.candidates] + [r["id"] for r in self.reports])


def _d(s: str | None) -> date | None:
    return date.fromisoformat(s) if s else None


def window(trip: dict, s: Settings) -> tuple[date, date] | None:
    start, end = _d(trip["start_date"]), _d(trip.get("end_date"))
    if end is None:
        return None
    return start - timedelta(days=s.days_before), end + timedelta(days=s.days_after)


def covered_charge_ids(reports: list[dict]) -> set[str]:
    return {l["card_transaction_id"] for r in reports if r["status"] in COUNTED_REPORT_STATUSES
            for l in r["lines"] if l.get("card_transaction_id")}


def candidates_by_trip(trips: list[dict], charges: list[dict], s: Settings) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {t["id"]: [] for t in trips}
    for t in trips:
        w = window(t, s)
        if w is None or t.get("status") == "cancelled":
            continue
        for c in charges:
            if c["employee_id"] == t["employee_id"] and w[0] <= _d(c["txn_date"]) <= w[1]:
                out[t["id"]].append(c)
    return out


def duplicates(charges: list[dict]) -> set[str]:
    seen: dict[tuple, list[str]] = {}
    for c in charges:
        seen.setdefault((c["employee_id"], c["merchant"], c["amount"], c["txn_date"]), []).append(c["id"])
    return {i for ids in seen.values() if len(ids) > 1 for i in ids}


def build_facts(trips: list[dict], charges: list[dict], reports: list[dict], s: Settings) -> list[Facts]:
    """One Facts per trip, plus one per orphan charge."""
    cands = candidates_by_trip(trips, charges, s)
    covered = covered_charge_ids(reports)
    trip_count: dict[str, int] = {}
    for lst in cands.values():
        for c in lst:
            trip_count[c["id"]] = trip_count.get(c["id"], 0) + 1
    dups = duplicates(charges)

    facts = []
    for t in trips:
        if t.get("status") == "cancelled":
            continue
        cs = cands[t["id"]]
        cids = {c["id"] for c in cs}
        rs = [r for r in reports if r.get("trip_id") == t["id"]
              or any(l.get("card_transaction_id") in cids for l in r["lines"])]
        end = _d(t.get("end_date"))
        facts.append(Facts(
            target_kind="trip", target_id=t["id"], employee_id=t["employee_id"],
            candidates=cs, covered_ids={i for i in cids if i in covered}, reports=rs,
            ambiguous_ids=sorted(i for i in cids if trip_count.get(i, 0) > 1),
            duplicate_ids=sorted(i for i in cids if i in dups),
            missing_end_date=end is None,
            upcoming=_d(t["start_date"]) > s.as_of,
            days_since_end=(s.as_of - end).days if end and end < s.as_of else None,
        ))

    near_missing_end = [(t["employee_id"], _d(t["start_date"])) for t in trips
                        if not t.get("end_date") and t.get("status") != "cancelled"]
    for c in charges:
        if trip_count.get(c["id"], 0) or c["id"] in covered or _d(c["txn_date"]) > s.as_of:
            continue
        cd = _d(c["txn_date"])
        if any(e == c["employee_id"] and st - timedelta(days=s.days_before) <= cd <= st + timedelta(days=s.days_after)
               for e, st in near_missing_end):
            continue
        facts.append(Facts(target_kind="charge", target_id=c["id"], employee_id=c["employee_id"],
                           candidates=[c], covered_ids=set(), days_since_end=(s.as_of - cd).days))
    return facts


def rule_status(f: Facts) -> tuple[str, str | None]:
    """What the rules alone would say. Mock mode uses this; the real agent is checked against it."""
    if f.target_kind == "charge":
        return "anomaly", "orphan_charge"
    if f.missing_end_date:
        return "needs_review", "missing_end_date"
    if f.upcoming:
        return "upcoming", None
    if f.ambiguous_ids:
        return "needs_review", "ambiguous_match"
    if f.duplicate_ids and any(i not in f.covered_ids for i in f.duplicate_ids):
        return "needs_review", "possible_duplicate"
    if f.outstanding == ZERO:
        return "fully_expensed", None
    if not f.covered_ids:
        return "unexpensed", None
    return "partially_expensed", None
