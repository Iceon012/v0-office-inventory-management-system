import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db, users, type User, type UserRole } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) return null

    try {
      const [profile] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)
      return profile ?? null
    } catch (dbError) {
      console.log("[v0] Database query failed, users table may not exist yet")
      // Return a temporary user object based on auth data if table doesn't exist
      return {
        id: authUser.id,
        email: authUser.email || "",
        fullName: authUser.user_metadata?.full_name || null,
        role: "employee" as const,
        department: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User
    }
  } catch (error) {
    console.error("[v0] Error in getCurrentUser:", error)
    return null
  }
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
