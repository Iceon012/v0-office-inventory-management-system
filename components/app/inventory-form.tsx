"use client"

import { useActionState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import type { Category, InventoryItem } from "@/lib/db"
import type { ItemFormState } from "@/app/(app)/inventory/actions"

type Action = (prev: ItemFormState, formData: FormData) => Promise<ItemFormState>

export function InventoryForm({
  action,
  categories,
  item,
  cancelHref,
}: {
  action: Action
  categories: Category[]
  item?: InventoryItem
  cancelHref: string
}) {
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(action, {})

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error])

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={item?.name ?? ""} placeholder="e.g. Ballpoint Pen" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={item?.sku ?? ""} placeholder="STA-PEN-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" defaultValue={item?.categoryId ?? "none"}>
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={item?.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity in stock</Label>
            <Input id="quantity" name="quantity" type="number" min={0} required defaultValue={item?.quantity ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock">Minimum stock</Label>
            <Input id="minStock" name="minStock" type="number" min={0} required defaultValue={item?.minStock ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit price (USD)</Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min={0}
              step="0.01"
              defaultValue={item?.unitPrice ?? "0"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={item?.location ?? ""} placeholder="e.g. Shelf A1" />
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  )
}
