import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db, users, type User, type UserRole } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)
  return profile ?? null
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  return user
}

export async function requireRole(...allowed: UserRole[]): Promise<User> {
  const user = await requireUser()
  if (!allowed.includes(user.role)) {
    redirect("/dashboard?error=forbidden")
  }
  return user
}

export function canManageInventory(role: UserRole) {
  return role === "admin" || role === "manager"
}

export function canApproveRequests(role: UserRole) {
  return role === "admin" || role === "manager"
}

export function canManageUsers(role: UserRole) {
  return role === "admin"
}
