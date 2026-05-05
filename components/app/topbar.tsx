import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "./user-menu"
import { NotificationsBell } from "./notifications-bell"
import { db, notifications } from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import type { User } from "@/lib/db"

export async function Topbar({ user }: { user: User }) {
  const recent = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(15)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <div className="flex-1" />
      <NotificationsBell userId={user.id} initial={recent} />
      <UserMenu user={user} />
    </header>
  )
}
