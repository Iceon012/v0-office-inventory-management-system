"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db, categories } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { logAction } from "@/lib/audit"

export async function createCategoryAction(formData: FormData) {
  const user = await requireRole("admin", "manager")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const color = String(formData.get("color") ?? "slate")
  if (!name) return
  try {
    const [created] = await db
      .insert(categories)
      .values({ name, description, color })
      .returning({ id: categories.id })
    await logAction({
      actorId: user.id,
      action: "created",
      entityType: "category",
      entityId: created.id,
      metadata: { name },
    })
  } catch {
    // unique violation — silently ignore for now
  }
  revalidatePath("/categories")
  revalidatePath("/inventory")
}

export async function deleteCategoryAction(id: string) {
  const user = await requireRole("admin", "manager")
  await db.delete(categories).where(eq(categories.id, id))
  await logAction({ actorId: user.id, action: "deleted", entityType: "category", entityId: id })
  revalidatePath("/categories")
  revalidatePath("/inventory")
}
