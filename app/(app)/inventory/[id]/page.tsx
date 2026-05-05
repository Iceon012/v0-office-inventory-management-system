import Link from "next/link"
import { notFound } from "next/navigation"
import { eq, desc } from "drizzle-orm"
import { db, inventoryItems, categories, auditLogs, users } from "@/lib/db"
import { requireUser, canManageInventory } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StockBadge } from "@/components/app/stock-badge"
import { formatCurrency, formatDate, formatRelative } from "@/lib/format"
import { Pencil, ArrowLeft } from "lucide-react"
import { adjustStockAction, deleteItemAction } from "../actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()

  const [item] = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      description: inventoryItems.description,
      quantity: inventoryItems.quantity,
      minStock: inventoryItems.minStock,
      unitPrice: inventoryItems.unitPrice,
      location: inventoryItems.location,
      createdAt: inventoryItems.createdAt,
      updatedAt: inventoryItems.updatedAt,
      categoryName: categories.name,
    })
    .from(inventoryItems)
    .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
    .where(eq(inventoryItems.id, id))
    .limit(1)

  if (!item) notFound()

  const history = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.fullName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(eq(auditLogs.entityId, id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20)

  const canManage = canManageInventory(user.role)

  return (
    <>
      <PageHeader
        title={item.name}
        description={
          item.categoryName ? `${item.categoryName} · ${item.sku ?? "no SKU"}` : (item.sku ?? "Inventory item")
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {canManage && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/inventory/${item.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {item.name} from inventory. Past requests that reference it will
                        block deletion.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={deleteItemAction.bind(null, item.id)}>
                        <AlertDialogAction type="submit">Delete</AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</dt>
                <dd className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular-nums">
                  {item.quantity}
                  <StockBadge quantity={item.quantity} minStock={item.minStock} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Min stock</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{item.minStock}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Unit price</dt>
                <dd className="mt-1 text-lg font-medium">{formatCurrency(item.unitPrice)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
                <dd className="mt-1 text-lg font-medium">{item.location ?? "—"}</dd>
              </div>
              {item.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm leading-relaxed">{item.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
                <dd className="mt-1 text-sm">{formatDate(item.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</dt>
                <dd className="mt-1 text-sm">{formatDate(item.updatedAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adjust stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={adjustStockAction} className="space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <div className="space-y-2">
                  <Label htmlFor="delta">Change (+/−)</Label>
                  <Input
                    id="delta"
                    name="delta"
                    type="number"
                    required
                    placeholder="e.g. -5 or 10"
                    defaultValue=""
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" placeholder="e.g. Restock from vendor" />
                </div>
                <Button type="submit" className="w-full">
                  Apply adjustment
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {history.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="divide-y">
              {history.map((h) => {
                const meta = (h.metadata ?? {}) as Record<string, unknown>
                return (
                  <li key={h.id} className="flex items-start justify-between gap-3 px-6 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{h.actorName ?? h.actorEmail ?? "System"}</span>{" "}
                      <span className="text-muted-foreground">{h.action.replaceAll("_", " ")}</span>
                      {typeof meta.delta === "number" && (
                        <span className="ml-1 font-mono text-xs">
                          ({meta.delta > 0 ? "+" : ""}
                          {meta.delta as number})
                        </span>
                      )}
                      {meta.reason ? (
                        <p className="text-xs text-muted-foreground">{String(meta.reason)}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(h.createdAt)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
