import { db, auditLogs, notifications } from "@/lib/db"

export async function logAction(params: {
  actorId: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}) {
  await db.insert(auditLogs).values({
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    metadata: params.metadata ?? {},
  })
}

export async function notify(params: {
  userId: string
  title: string
  body?: string
  type?: "info" | "success" | "warning" | "error"
  link?: string
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type ?? "info",
    link: params.link,
  })
}
