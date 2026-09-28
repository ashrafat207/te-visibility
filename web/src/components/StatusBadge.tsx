const COLORS: Record<string, string> = {
  fully_expensed: 'badge-green',
  partially_expensed: 'badge-amber',
  unexpensed: 'badge-red',
  anomaly: 'badge-red',
  needs_review: 'badge-amber',
  upcoming: 'badge-blue',
  submitted: 'badge-blue',
  approved: 'badge-green',
  draft: 'badge-gray',
  rejected: 'badge-red',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? 'badge-gray'
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>
}
