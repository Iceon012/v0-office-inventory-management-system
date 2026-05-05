"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db, notifications } from "@/lib/db"
import { requireUser } from "@/lib/auth"

export async function markAllReadAction() {
  const user = await requireUser()
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
  revalidatePath("/notifications")
}
