import { sql, eq } from "drizzle-orm"
import { db, categories, inventoryItems } from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { canManageInventory } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import { createCategoryAction, deleteCategoryAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const user = await requireUser()

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      itemCount: sql<number>`count(${inventoryItems.id})::int`,
    })
    .from(categories)
    .leftJoin(inventoryItems, eq(inventoryItems.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name)

  const canManage = canManageInventory(user.role)

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group inventory items so they're easier to find and report on."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All categories</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {rows.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No categories yet.</p>
              ) : (
                <ul className="divide-y">
                  {rows.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 px-6 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{c.name}</p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {c.itemCount} item{c.itemCount === 1 ? "" : "s"}
                        </span>
                        {canManage && (
                          <form action={deleteCategoryAction.bind(null, c.id)}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete category ${c.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New category</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createCategoryAction} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Stationery" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <Button type="submit" className="w-full">
                  Create category
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
