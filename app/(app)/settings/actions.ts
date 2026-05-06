"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db, users } from "@/lib/db"
import { requireUser } from "@/lib/auth.server"

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser()
  const fullName = String(formData.get("fullName") ?? "").trim() || null
  const department = String(formData.get("department") ?? "").trim() || null
  await db.update(users).set({ fullName, department, updatedAt: new Date() }).where(eq(users.id, user.id))
  revalidatePath("/settings")
  revalidatePath("/dashboard")
}
