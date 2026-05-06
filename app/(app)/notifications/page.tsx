import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db, notifications } from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { markAllReadAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const user = await requireUser()
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(200)

  const unread = items.filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your requests, low stock alerts, and announcements."
        actions={
          <form action={markAllReadAction}>
            <Button type="submit" variant="outline" disabled={unread === 0}>
              <Check className="h-4 w-4" />
              Mark all read ({unread})
            </Button>
          </form>
        }
      />

      <Card>
        <CardContent className="px-0">
          {items.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </>
                )
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "px-6 py-4 transition-colors hover:bg-muted/40",
                      !n.read && "bg-primary/5",
                    )}
                  >
                    {n.link ? (
                      <Link href={n.link} className="block">
                        {Inner}
                      </Link>
                    ) : (
                      Inner
                    )}
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
