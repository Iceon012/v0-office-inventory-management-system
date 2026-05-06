import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import {
  db,
  requests,
  requestItems,
  inventoryItems,
  users,
} from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { canApproveRequests } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RequestStatusBadge } from "@/components/app/stock-badge"
import { formatDate, formatCurrency, formatRelative } from "@/lib/format"
import { ArrowLeft, FileDown } from "lucide-react"
import { decideRequestAction, cancelRequestAction } from "../actions"

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()

  const requester = alias(users, "requester")
  const decider = alias(users, "decider")

  const [req] = await db
    .select({
      id: requests.id,
      status: requests.status,
      purpose: requests.purpose,
      createdAt: requests.createdAt,
      decidedAt: requests.decidedAt,
      decisionNotes: requests.decisionNotes,
      fulfilledAt: requests.fulfilledAt,
      requesterId: requests.requesterId,
      requesterName: requester.fullName,
      requesterEmail: requester.email,
      requesterDept: requester.department,
      deciderName: decider.fullName,
      deciderEmail: decider.email,
    })
    .from(requests)
    .leftJoin(requester, eq(requests.requesterId, requester.id))
    .leftJoin(decider, eq(requests.decidedBy, decider.id))
    .where(eq(requests.id, id))
    .limit(1)

  if (!req) notFound()

  // Permission: requester or approver
  if (req.requesterId !== user.id && !canApproveRequests(user.role)) {
    notFound()
  }

  const lines = await db
    .select({
      id: requestItems.id,
      quantityRequested: requestItems.quantityRequested,
      quantityFulfilled: requestItems.quantityFulfilled,
      itemName: inventoryItems.name,
      itemSku: inventoryItems.sku,
      unitPrice: inventoryItems.unitPrice,
      itemId: inventoryItems.id,
    })
    .from(requestItems)
    .leftJoin(inventoryItems, eq(requestItems.itemId, inventoryItems.id))
    .where(eq(requestItems.requestId, req.id))

  const totalLines = lines.reduce((s, l) => s + l.quantityRequested, 0)
  const totalValue = lines.reduce(
    (s, l) => s + l.quantityRequested * Number.parseFloat(l.unitPrice ?? "0"),
    0,
  )

  const canDecide = canApproveRequests(user.role) && req.status === "pending"
  const canCancel = req.requesterId === user.id && req.status === "pending"

  return (
    <>
      <PageHeader
        title={req.purpose || "Supply request"}
        description={`Submitted by ${req.requesterName ?? req.requesterEmail} · ${formatDate(req.createdAt)}`}
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href="/requests">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {req.status === "fulfilled" && (
              <Button asChild variant="outline">
                <Link href={`/api/receipts/${req.id}`} target="_blank">
                  <FileDown className="h-4 w-4" />
                  Download receipt
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Items</CardTitle>
            <RequestStatusBadge status={req.status} />
          </CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
                >
                  <div className="min-w-0">
                    <Link href={`/inventory/${l.itemId}`} className="font-medium hover:underline">
                      {l.itemName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      SKU {l.itemSku ?? "—"} · {formatCurrency(l.unitPrice)} ea.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums font-medium">×{l.quantityRequested}</p>
                    {l.quantityFulfilled > 0 && (
                      <p className="text-xs text-emerald-700 tabular-nums">
                        {l.quantityFulfilled} fulfilled
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
              <span className="text-muted-foreground">
                {totalLines} unit{totalLines === 1 ? "" : "s"} · {lines.length} line
                {lines.length === 1 ? "" : "s"}
              </span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalValue)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requester</span>
                <span className="font-medium">
                  {req.requesterName ?? req.requesterEmail}
                  {req.requesterDept && (
                    <span className="ml-1 text-xs text-muted-foreground">({req.requesterDept})</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span>{formatRelative(req.createdAt)}</span>
              </div>
              {req.decidedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Decided by</span>
                  <span>{req.deciderName ?? req.deciderEmail ?? "—"}</span>
                </div>
              )}
              {req.fulfilledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fulfilled</span>
                  <span>{formatRelative(req.fulfilledAt)}</span>
                </div>
              )}
              {req.decisionNotes && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed">
                  <p className="mb-0.5 font-medium text-foreground">Decision notes</p>
                  {req.decisionNotes}
                </div>
              )}
            </CardContent>
          </Card>

          {canDecide && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={decideRequestAction} className="space-y-3">
                  <input type="hidden" name="id" value={req.id} />
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" name="notes" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="submit"
                      name="decision"
                      value="rejected"
                      variant="outline"
                    >
                      Reject
                    </Button>
                    <Button type="submit" name="decision" value="approved">
                      Approve
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {canCancel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cancel</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={cancelRequestAction}>
                  <input type="hidden" name="id" value={req.id} />
                  <Button type="submit" variant="outline" className="w-full">
                    Cancel this request
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
