import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Topbar } from "@/components/app/topbar"
import { requireUser } from "@/lib/auth"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <Topbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
