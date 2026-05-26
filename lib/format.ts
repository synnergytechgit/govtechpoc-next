export const brl = (n: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n ?? 0))

export const pct = (n: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)}%`

export const dateBR = (iso: string | Date | null | undefined) => {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d)
}

export const daysUntil = (iso: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}
