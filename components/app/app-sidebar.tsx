"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  ScrollText,
  BarChart3,
  Bell,
  Users,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { UserRole } from "@/lib/db"
import { canManageUsers } from "@/lib/auth"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Categories", href: "/categories", icon: Tags },
  { title: "Requests", href: "/requests", icon: ClipboardList },
]

const insightsNav: NavItem[] = [
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Audit log", href: "/audit", icon: ScrollText, roles: ["admin", "manager"] },
  { title: "Notifications", href: "/notifications", icon: Bell },
]

const adminNav: NavItem[] = [
  { title: "Users", href: "/users", icon: Users, roles: ["admin"] },
  { title: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()

  function visible(items: NavItem[]) {
    return items.filter((i) => !i.roles || i.roles.includes(role))
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 font-semibold tracking-tight">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">Stockroom</span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible(mainNav).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible(insightsNav).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {(canManageUsers(role) || role === "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visible(adminNav).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
          Stockroom v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
