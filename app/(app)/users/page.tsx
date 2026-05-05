import { db, users } from "@/lib/db"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/format"
import { UserRoleSelect } from "@/components/app/user-role-select"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const me = await requireRole("admin")
  const list = await db.select().from(users).orderBy(users.createdAt)

  return (
    <>
      <PageHeader title="Team" description="Manage roles for everyone in your office." />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((u) => {
              const initials = (u.fullName ?? u.email)
                .split(/\s+|@/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join("")
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{u.fullName ?? u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.department ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <UserRoleSelect userId={u.id} role={u.role} disabled={u.id === me.id} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
