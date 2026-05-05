export function formatCurrency(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const secs = Math.round(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(d)
}

export function stockStatus(quantity: number, minStock: number): "out" | "low" | "ok" {
  if (quantity <= 0) return "out"
  if (quantity <= minStock) return "low"
  return "ok"
}
