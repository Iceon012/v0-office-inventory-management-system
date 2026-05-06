import { db, categories } from "@/lib/db"
import { requireRole } from "@/lib/auth.server"
import { PageHeader } from "@/components/app/page-header"
import { InventoryForm } from "@/components/app/inventory-form"
import { createItemAction } from "../actions"

export default async function NewInventoryItemPage() {
  await requireRole("admin", "manager")
  const allCategories = await db.select().from(categories).orderBy(categories.name)

  return (
    <>
      <PageHeader title="Add inventory item" description="Add a new product to the office stockroom." />
      <div className="max-w-3xl">
        <InventoryForm action={createItemAction} categories={allCategories} cancelHref="/inventory" />
      </div>
    </>
  )
}
