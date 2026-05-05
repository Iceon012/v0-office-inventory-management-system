import Link from "next/link"
import { sql, eq, desc, and, type SQL } from "drizzle-orm"
import { db, requests, requestItems, users } from "@/lib/db"
import { requireUser, canApproveRequests } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RequestStatusBadge } from "@/components/app/stock-badge"
import { Plus } from "lucide-react"
import { formatRelative } from "@/lib/format"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

type Status = "all" | "mine" | "pending" | "approved" | "fulfilled" | "rejected" | "cancelled"

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: Status }>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const tab: Status = sp.tab ?? (canApproveRequests(user.role) ? "pending" : "mine")

  const conditions: SQL[] = []
  if (tab === "mine") conditions.push(eq(requests.requesterId, user.id))
  else if (
    tab === "pending" ||
    tab === "approved" ||
    tab === "fulfilled" ||
    tab === "rejected" ||
    tab === "cancelled"
  ) {
    conditions.push(eq(requests.status, tab))
  }

  // Employees can only see their own; managers/admins see all
  if (!canApproveRequests(user.role)) {
    conditions.push(eq(requests.requesterId, user.id))
  }

  const rows = await db
    .select({
      id: requests.id,
      status: requests.status,
      purpose: requests.purpose,
      createdAt: requests.createdAt,
      requesterName: users.fullName,
      requesterEmail: users.email,
      lineCount: sql<number>`(select count(*) from ${requestItems} where ${requestItems.requestId} = ${requests.id})::int`,
    })
    .from(requests)
    .leftJoin(users, eq(requests.requesterId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(requests.createdAt))
    .limit(100)

  const tabs: { value: Status; label: string }[] = canApproveRequests(user.role)
    ? [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "fulfilled", label: "Fulfilled" },
        { value: "rejected", label: "Rejected" },
        { value: "mine", label: "My requests" },
        { value: "all", label: "All" },
      ]
    : [
        { value: "mine", label: "My requests" },
        { value: "pending", label: "Pending" },
        { value: "fulfilled", label: "Fulfilled" },
      ]

  return (
    <>
      <PageHeader
        title="Requests"
        description={canApproveRequests(user.role) ? "Approve, reject, or fulfill supply requests." : "Submit and track your supply requests."}
        actions={
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="h-4 w-4" />
              New request
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} className="mb-4">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} asChild>
              <Link href={`/requests?tab=${t.value}`}>{t.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purpose</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No requests in this view.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/requests/${r.id}`} className="hover:underline">
                      {r.purpose || "Supply request"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.requesterName ?? r.requesterEmail}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.lineCount}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatRelative(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
