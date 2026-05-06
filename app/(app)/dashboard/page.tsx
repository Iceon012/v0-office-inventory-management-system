import Link from "next/link"
import { sql, desc, eq, and, lte } from "drizzle-orm"
import {
  db,
  inventoryItems,
  categories,
  requests,
  auditLogs,
  users,
} from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, ClipboardList, DollarSign, Plus, ArrowRight } from "lucide-react"
import { StockBadge, RequestStatusBadge } from "@/components/app/stock-badge"
import { formatCurrency, formatRelative } from "@/lib/format"
import { safeQuery } from "@/lib/db/safe-query"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireUser()

  const stats = await safeQuery(
    () =>
      db
        .select({
          itemCount: sql<number>`count(*)::int`,
          totalQty: sql<number>`coalesce(sum(${inventoryItems.quantity}),0)::int`,
          totalValue: sql<string>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}),0)::text`,
          lowStock: sql<number>`count(*) filter (where ${inventoryItems.quantity} <= ${inventoryItems.minStock})::int`,
          outOfStock: sql<number>`count(*) filter (where ${inventoryItems.quantity} <= 0)::int`,
        })
        .from(inventoryItems),
    [{ itemCount: 0, totalQty: 0, totalValue: "0", lowStock: 0, outOfStock: 0 }],
    "loading inventory stats",
  )

  const statsRow = stats[0] || { itemCount: 0, totalQty: 0, totalValue: "0", lowStock: 0, outOfStock: 0 }

  const pendingResult = await safeQuery(
    () =>
      db
        .select({ pending: sql<number>`count(*)::int` })
        .from(requests)
        .where(eq(requests.status, "pending")),
    [{ pending: 0 }],
    "loading pending requests",
  )

  const pending = pendingResult[0]?.pending ?? 0

  const lowStockItems = await safeQuery(
    () =>
      db
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          sku: inventoryItems.sku,
          quantity: inventoryItems.quantity,
          minStock: inventoryItems.minStock,
          categoryName: categories.name,
        })
        .from(inventoryItems)
        .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
        .where(lte(inventoryItems.quantity, inventoryItems.minStock))
        .orderBy(inventoryItems.quantity)
        .limit(6),
    [],
    "loading low stock items",
  )

  const recentRequests = await safeQuery(
    () =>
      db
        .select({
          id: requests.id,
          status: requests.status,
          purpose: requests.purpose,
          createdAt: requests.createdAt,
          requesterName: users.fullName,
          requesterEmail: users.email,
        })
        .from(requests)
        .leftJoin(users, eq(requests.requesterId, users.id))
        .orderBy(desc(requests.createdAt))
        .limit(5),
    [],
    "loading recent requests",
  )

  const recentActivity = await safeQuery(
    () =>
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          createdAt: auditLogs.createdAt,
          actorName: users.fullName,
          actorEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(8),
    [],
    "loading recent activity",
  )

  const metrics = [
    {
      label: "Inventory items",
      value: statsRow.itemCount,
      hint: `${statsRow.totalQty} units in stock`,
      icon: Package,
    },
    {
      label: "Total value",
      value: formatCurrency(statsRow.totalValue),
      hint: "Across all categories",
      icon: DollarSign,
    },
    {
      label: "Low / out of stock",
      value: `${statsRow.lowStock}`,
      hint: `${statsRow.outOfStock} fully out`,
      icon: AlertTriangle,
      tone: "warn" as const,
    },
    {
      label: "Pending requests",
      value: pending,
      hint: "Awaiting approval",
      icon: ClipboardList,
    },
  ]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.fullName?.split(" ")[0] ?? "there"}`}
        description="A quick look at your office inventory and what needs attention today."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/requests/new">New request</Link>
            </Button>
            {(user.role === "admin" || user.role === "manager") && (
              <Button asChild>
                <Link href="/inventory/new">
                  <Plus className="h-4 w-4" />
                  Add item
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon
                className={
                  m.tone === "warn" ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-muted-foreground"
                }
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{m.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Items needing restock</CardTitle>
              <p className="text-sm text-muted-foreground">Sorted by urgency.</p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/inventory">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {lowStockItems.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Everything is well stocked. Great work.
              </p>
            ) : (
              <ul className="divide-y">
                {lowStockItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <Link href={`/inventory/${item.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.categoryName ?? "Uncategorized"} · {item.sku ?? "no SKU"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums">
                        <span className="font-semibold">{item.quantity}</span>
                        <span className="text-muted-foreground"> / {item.minStock} min</span>
                      </span>
                      <StockBadge quantity={item.quantity} minStock={item.minStock} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent requests</CardTitle>
              <p className="text-sm text-muted-foreground">Latest activity.</p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/requests">
                View <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {recentRequests.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              <ul className="divide-y">
                {recentRequests.map((r) => (
                  <li key={r.id} className="px-6 py-3">
                    <Link href={`/requests/${r.id}`} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {r.purpose || "Supply request"}
                        </span>
                        <RequestStatusBadge status={r.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.requesterName ?? r.requesterEmail} · {formatRelative(r.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {recentActivity.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium uppercase">
                      {(a.actorName ?? a.actorEmail ?? "S").slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium">{a.actorName ?? a.actorEmail ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.action.replaceAll("_", " ")} {a.entityType.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
