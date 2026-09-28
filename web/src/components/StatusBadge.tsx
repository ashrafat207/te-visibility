const COLORS: Record<string, string> = {
  fully_expensed: 'badge-green',
  partially_expensed: 'badge-amber',
  unexpensed: 'badge-orange',
  anomaly: 'badge-purple',
  needs_review: 'badge-blue',
  upcoming: 'badge-gray',
  submitted: 'badge-blue',
  approved: 'badge-green',
  draft: 'badge-gray',
  rejected: 'badge-orange',
  completed: 'badge-green',
  planned: 'badge-gray',
  booked: 'badge-blue',
  cancelled: 'badge-gray',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? 'badge-gray'
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>
}
