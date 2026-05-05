import { stockStatus } from "@/lib/format"
import { cn } from "@/lib/utils"

export function StockBadge({ quantity, minStock }: { quantity: number; minStock: number }) {
  const status = stockStatus(quantity, minStock)
  const label = status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "In stock"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "out" && "bg-rose-100 text-rose-700",
        status === "low" && "bg-amber-100 text-amber-700",
        status === "ok" && "bg-emerald-100 text-emerald-700",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "out" && "bg-rose-500",
          status === "low" && "bg-amber-500",
          status === "ok" && "bg-emerald-500",
        )}
      />
      {label}
    </span>
  )
}

export function RequestStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    rejected: "bg-rose-100 text-rose-700",
    fulfilled: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  )
}
