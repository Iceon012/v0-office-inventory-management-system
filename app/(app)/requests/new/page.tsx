import { requireUser } from "@/lib/auth"
import { db, inventoryItems } from "@/lib/db"
import { PageHeader } from "@/components/app/page-header"
import { RequestForm } from "@/components/app/request-form"
import { createRequestAction } from "../actions"

export default async function NewRequestPage() {
  await requireUser()
  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      quantity: inventoryItems.quantity,
    })
    .from(inventoryItems)
    .orderBy(inventoryItems.name)

  return (
    <>
      <PageHeader title="New request" description="Request supplies from the office stockroom." />
      <div className="max-w-3xl">
        <RequestForm items={items} action={createRequestAction} />
      </div>
    </>
  )
}
