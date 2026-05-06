import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db, inventoryItems, categories } from "@/lib/db"
import { requireRole } from "@/lib/auth.server"
import { PageHeader } from "@/components/app/page-header"
import { InventoryForm } from "@/components/app/inventory-form"
import { updateItemAction } from "../../actions"

export default async function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole("admin", "manager")

  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1)
  if (!item) notFound()

  const allCategories = await db.select().from(categories).orderBy(categories.name)
  const action = updateItemAction.bind(null, id)

  return (
    <>
      <PageHeader title={`Edit ${item.name}`} description="Update item details, stock levels, and pricing." />
      <div className="max-w-3xl">
        <InventoryForm action={action} categories={allCategories} item={item} cancelHref={`/inventory/${id}`} />
      </div>
    </>
  )
}
