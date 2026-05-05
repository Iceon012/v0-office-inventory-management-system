"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db, users, type UserRole } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { logAction } from "@/lib/audit"

export async function setUserRoleAction(userId: string, role: UserRole) {
  const me = await requireRole("admin")
  if (userId === me.id) return
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId))
  await logAction({
    actorId: me.id,
    action: "role_changed",
    entityType: "user",
    entityId: userId,
    metadata: { role },
  })
  revalidatePath("/users")
}
