"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq, inArray } from "drizzle-orm"
import {
  db,
  requests,
  requestItems,
  inventoryItems,
  users,
} from "@/lib/db"
import { requireUser, requireRole } from "@/lib/auth"
import { logAction, notify } from "@/lib/audit"

export async function createRequestAction(formData: FormData) {
  const user = await requireUser()
  const purpose = String(formData.get("purpose") ?? "").trim() || null

  const itemIds = formData.getAll("itemId").map(String).filter(Boolean)
  const quantities = formData.getAll("quantity").map((v) => Number.parseInt(String(v), 10))

  const lines = itemIds
    .map((id, i) => ({ id, qty: quantities[i] ?? 0 }))
    .filter((l) => l.id && Number.isFinite(l.qty) && l.qty > 0)

  if (lines.length === 0) return

  const [created] = await db
    .insert(requests)
    .values({ requesterId: user.id, purpose, status: "pending" })
    .returning({ id: requests.id })

  await db.insert(requestItems).values(
    lines.map((l) => ({
      requestId: created.id,
      itemId: l.id,
      quantityRequested: l.qty,
    })),
  )

  await logAction({
    actorId: user.id,
    action: "submitted",
    entityType: "request",
    entityId: created.id,
    metadata: { lines: lines.length },
  })

  // Notify all admins and managers
  const approvers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, ["admin", "manager"]))

  await Promise.all(
    approvers
      .filter((a) => a.id !== user.id)
      .map((a) =>
        notify({
          userId: a.id,
          title: "New supply request",
          body: `${user.fullName ?? user.email} submitted a request${purpose ? `: ${purpose}` : "."}`,
          type: "info",
          link: `/requests/${created.id}`,
        }),
      ),
  )

  revalidatePath("/requests")
  revalidatePath("/dashboard")
  redirect(`/requests/${created.id}`)
}

export async function decideRequestAction(formData: FormData) {
  const decider = await requireRole("admin", "manager")
  const id = String(formData.get("id") ?? "")
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected"
  const notes = String(formData.get("notes") ?? "").trim() || null
  if (!id || !["approved", "rejected"].includes(decision)) return

  const [req] = await db.select().from(requests).where(eq(requests.id, id)).limit(1)
  if (!req || req.status !== "pending") return

  await db
    .update(requests)
    .set({
      status: decision,
      decidedBy: decider.id,
      decidedAt: new Date(),
      decisionNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, id))

  if (decision === "approved") {
    // Deduct inventory and mark fulfilled
    const lines = await db.select().from(requestItems).where(eq(requestItems.requestId, id))
    for (const line of lines) {
      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, line.itemId)).limit(1)
      if (!item) continue
      const fulfill = Math.min(line.quantityRequested, item.quantity)
      await db
        .update(inventoryItems)
        .set({ quantity: Math.max(0, item.quantity - fulfill), updatedAt: new Date() })
        .where(eq(inventoryItems.id, line.itemId))
      await db
        .update(requestItems)
        .set({ quantityFulfilled: fulfill })
        .where(eq(requestItems.id, line.id))
    }
    await db
      .update(requests)
      .set({ status: "fulfilled", fulfilledAt: new Date() })
      .where(eq(requests.id, id))
  }

  await logAction({
    actorId: decider.id,
    action: decision === "approved" ? "approved" : "rejected",
    entityType: "request",
    entityId: id,
    metadata: { notes },
  })

  await notify({
    userId: req.requesterId,
    title: decision === "approved" ? "Request approved" : "Request rejected",
    body: notes ?? (decision === "approved" ? "Your request has been fulfilled." : "Your request was rejected."),
    type: decision === "approved" ? "success" : "warning",
    link: `/requests/${id}`,
  })

  revalidatePath("/requests")
  revalidatePath(`/requests/${id}`)
  revalidatePath("/inventory")
  revalidatePath("/dashboard")
}

export async function cancelRequestAction(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const [req] = await db.select().from(requests).where(eq(requests.id, id)).limit(1)
  if (!req || req.requesterId !== user.id || req.status !== "pending") return
  await db
    .update(requests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(requests.id, id))
  await logAction({
    actorId: user.id,
    action: "cancelled",
    entityType: "request",
    entityId: id,
  })
  revalidatePath("/requests")
  revalidatePath(`/requests/${id}`)
}
