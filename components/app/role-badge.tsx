import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/db"

const styles: Record<UserRole, string> = {
  admin: "bg-primary text-primary-foreground hover:bg-primary",
  manager: "bg-emerald-600 text-white hover:bg-emerald-600",
  employee: "bg-muted text-muted-foreground hover:bg-muted",
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(styles[role], "capitalize", className)}>
      {role}
    </Badge>
  )
}
