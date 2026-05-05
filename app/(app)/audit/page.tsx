import { desc, eq } from "drizzle-orm"
import { db, auditLogs, users } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  await requireRole("admin", "manager")

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: users.fullName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change made to inventory, categories, and requests."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No activity yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const meta = (r.metadata ?? {}) as Record<string, unknown>
                const summary = Object.entries(meta)
                  .filter(([k]) => k !== "id")
                  .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                  .join(" · ")
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.actorName ?? r.actorEmail ?? "System"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.action.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {r.entityType.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                      {summary || "—"}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
