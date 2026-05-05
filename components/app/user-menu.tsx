"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { RoleBadge } from "./role-badge"
import type { User } from "@/lib/db"

function initials(name: string | null | undefined, email: string) {
  const source = name?.trim() || email
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("")
}

export function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials(user.fullName, user.email)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user.fullName ?? user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{user.fullName ?? user.email}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            <div className="pt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action="/auth/sign-out" method="post" className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 text-left">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
