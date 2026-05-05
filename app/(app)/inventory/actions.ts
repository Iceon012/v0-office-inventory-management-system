"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db, inventoryItems } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { logAction } from "@/lib/audit"

export type ItemFormState = { error?: string; ok?: boolean }

function parseFormData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const sku = String(formData.get("sku") ?? "").trim() || null
  const description = String(formData.get("description") ?? "").trim() || null
  const categoryId = String(formData.get("categoryId") ?? "") || null
  const quantity = Number.parseInt(String(formData.get("quantity") ?? "0"), 10)
  const minStock = Number.parseInt(String(formData.get("minStock") ?? "0"), 10)
  const unitPrice = String(formData.get("unitPrice") ?? "0")
  const location = String(formData.get("location") ?? "").trim() || null
  return { name, sku, description, categoryId, quantity, minStock, unitPrice, location }
}

export async function createItemAction(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  const user = await requireRole("admin", "manager")
  const data = parseFormData(formData)
  if (!data.name) return { error: "Name is required." }
  if (Number.isNaN(data.quantity) || data.quantity < 0) return { error: "Quantity must be 0 or greater." }
  if (Number.isNaN(data.minStock) || data.minStock < 0) return { error: "Min stock must be 0 or greater." }

  try {
    const [created] = await db
      .insert(inventoryItems)
      .values({
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId && data.categoryId !== "none" ? data.categoryId : null,
        quantity: data.quantity,
        minStock: data.minStock,
        unitPrice: data.unitPrice,
        location: data.location,
        createdBy: user.id,
      })
      .returning({ id: inventoryItems.id })

    await logAction({
      actorId: user.id,
      action: "created",
      entityType: "inventory_item",
      entityId: created.id,
      metadata: { name: data.name, quantity: data.quantity },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create item."
    return { error: msg }
  }

  revalidatePath("/inventory")
  revalidatePath("/dashboard")
  redirect("/inventory")
}

export async function updateItemAction(
  id: string,
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const user = await requireRole("admin", "manager")
  const data = parseFormData(formData)
  if (!data.name) return { error: "Name is required." }

  try {
    await db
      .update(inventoryItems)
      .set({
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId && data.categoryId !== "none" ? data.categoryId : null,
        quantity: data.quantity,
        minStock: data.minStock,
        unitPrice: data.unitPrice,
        location: data.location,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))

    await logAction({
      actorId: user.id,
      action: "updated",
      entityType: "inventory_item",
      entityId: id,
      metadata: { name: data.name, quantity: data.quantity },
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update item." }
  }

  revalidatePath("/inventory")
  revalidatePath(`/inventory/${id}`)
  revalidatePath("/dashboard")
  redirect(`/inventory/${id}`)
}

export async function deleteItemAction(id: string) {
  const user = await requireRole("admin", "manager")
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id))
  await logAction({
    actorId: user.id,
    action: "deleted",
    entityType: "inventory_item",
    entityId: id,
  })
  revalidatePath("/inventory")
  revalidatePath("/dashboard")
  redirect("/inventory")
}

export async function adjustStockAction(formData: FormData) {
  const user = await requireRole("admin", "manager")
  const id = String(formData.get("id") ?? "")
  const delta = Number.parseInt(String(formData.get("delta") ?? "0"), 10)
  const reason = String(formData.get("reason") ?? "").trim() || null
  if (!id || Number.isNaN(delta) || delta === 0) return

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1)
  if (!item) return
  const next = Math.max(0, item.quantity + delta)
  await db
    .update(inventoryItems)
    .set({ quantity: next, updatedAt: new Date() })
    .where(eq(inventoryItems.id, id))

  await logAction({
    actorId: user.id,
    action: "stock_adjusted",
    entityType: "inventory_item",
    entityId: id,
    metadata: { delta, before: item.quantity, after: next, reason },
  })
  revalidatePath("/inventory")
  revalidatePath(`/inventory/${id}`)
  revalidatePath("/dashboard")
}
