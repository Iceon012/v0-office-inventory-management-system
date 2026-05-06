import type { UserRole } from "@/lib/db"

// Client-safe utility functions
export function canManageInventory(role: UserRole) {
  return role === "admin" || role === "manager"
}

export function canApproveRequests(role: UserRole) {
  return role === "admin" || role === "manager"
}

export function canManageUsers(role: UserRole) {
  return role === "admin"
}
