const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function Money({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="muted">—</span>
  return <span>{fmt.format(value)}</span>
}
