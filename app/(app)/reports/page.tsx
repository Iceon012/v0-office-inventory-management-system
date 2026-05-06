import { sql, eq, desc, gte } from "drizzle-orm"
import {
  db,
  inventoryItems,
  categories,
  requests,
  requestItems,
} from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { safeQuery } from "@/lib/db/safe-query"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportsCharts } from "@/components/app/reports-charts"
import { formatCurrency } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  await requireUser()

  const byCategory = await safeQuery(
    () =>
      db
        .select({
          category: categories.name,
          itemCount: sql<number>`count(${inventoryItems.id})::int`,
          totalQty: sql<number>`coalesce(sum(${inventoryItems.quantity}),0)::int`,
          totalValue: sql<string>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}),0)::text`,
        })
        .from(inventoryItems)
        .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
        .groupBy(categories.name)
        .orderBy(desc(sql`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}),0)`)),
    [],
    "loading category reports",
  )

  // Requests over the last 30 days, grouped by day
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const requestsTrend = await safeQuery(
    () =>
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${requests.createdAt}), 'Mon DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(requests)
        .where(gte(requests.createdAt, thirtyDaysAgo))
        .groupBy(sql`date_trunc('day', ${requests.createdAt})`)
        .orderBy(sql`date_trunc('day', ${requests.createdAt})`),
    [],
    "loading requests trend",
  )

  // Top requested items
  const topItems = await safeQuery(
    () =>
      db
        .select({
          name: inventoryItems.name,
          total: sql<number>`coalesce(sum(${requestItems.quantityRequested}),0)::int`,
        })
        .from(requestItems)
        .leftJoin(inventoryItems, eq(requestItems.itemId, inventoryItems.id))
        .groupBy(inventoryItems.name)
        .orderBy(desc(sql`coalesce(sum(${requestItems.quantityRequested}),0)`))
        .limit(8),
    [],
    "loading top items",
  )

  const totalValue = byCategory.reduce((s, c) => s + Number.parseFloat(c.totalValue), 0)

  return (
    <>
      <PageHeader title="Reports" description="Inventory value by category, request trends, and top consumed items." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total inventory value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatCurrency(totalValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across {byCategory.length} categor{byCategory.length === 1 ? "y" : "ies"}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {byCategory.map((c) => {
                const pct = totalValue > 0 ? (Number.parseFloat(c.totalValue) / totalValue) * 100 : 0
                return (
                  <li key={c.category ?? "uncategorized"} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.category ?? "Uncategorized"}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCurrency(c.totalValue)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <ReportsCharts trend={requestsTrend} topItems={topItems} />
    </>
  )
}
