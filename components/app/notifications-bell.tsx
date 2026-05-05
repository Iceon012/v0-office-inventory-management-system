"use client"

import { useEffect, useState } from "react"
import { Bell, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/db"

export function NotificationsBell({
  userId,
  initial,
}: {
  userId: string
  initial: Notification[]
}) {
  const [items, setItems] = useState<Notification[]>(initial)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as unknown as Notification
          setItems((prev) => [row, ...prev].slice(0, 20))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const unread = items.filter((n) => !n.read).length

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0} className="h-7 text-xs">
            <Check className="h-3 w-3" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Wrapper = (props: React.HTMLAttributes<HTMLDivElement>) =>
                  n.link ? (
                    <Link href={n.link} className="block">
                      <div {...props} />
                    </Link>
                  ) : (
                    <div {...props} />
                  )
                return (
                  <li key={n.id}>
                    <Wrapper
                      className={cn(
                        "flex flex-col gap-1 px-3 py-3 transition-colors hover:bg-muted/50",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                      <p className="text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</p>
                    </Wrapper>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t px-3 py-2">
          <Link href="/notifications" className="text-xs font-medium text-primary hover:underline">
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
