"use client"

import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UserRole } from "@/lib/db"
import { setUserRoleAction } from "@/app/(app)/users/actions"
import { toast } from "sonner"

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: UserRole
  disabled?: boolean
}) {
  const [pending, start] = useTransition()

  function onChange(value: string) {
    start(async () => {
      try {
        await setUserRoleAction(userId, value as UserRole)
        toast.success(`Role updated to ${value}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role")
      }
    })
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={disabled || pending}>
      <SelectTrigger className="h-8 w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="employee">Employee</SelectItem>
      </SelectContent>
    </Select>
  )
}
