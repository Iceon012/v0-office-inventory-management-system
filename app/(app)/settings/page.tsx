import { requireUser } from "@/lib/auth.server"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/app/role-badge"
import { updateProfileAction } from "./actions"

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile information." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" defaultValue={user.fullName ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" defaultValue={user.department ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled />
                <p className="text-xs text-muted-foreground">Email is managed by your auth provider.</p>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RoleBadge role={user.role} />
            <p className="text-muted-foreground leading-relaxed">
              {user.role === "admin"
                ? "You have full access — manage inventory, approve requests, and manage users."
                : user.role === "manager"
                  ? "You can manage inventory and approve requests."
                  : "You can request supplies and view your own requests."}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
