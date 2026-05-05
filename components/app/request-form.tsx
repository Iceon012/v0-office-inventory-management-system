"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InventoryItem } from "@/lib/db"

type Line = { itemId: string; quantity: number }

export function RequestForm({
  items,
  action,
}: {
  items: Pick<InventoryItem, "id" | "name" | "sku" | "quantity">[]
  action: (formData: FormData) => Promise<void>
}) {
  const [lines, setLines] = useState<Line[]>([{ itemId: "", quantity: 1 }])

  function update(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function add() {
    setLines((prev) => [...prev, { itemId: "", quantity: 1 }])
  }
  function remove(i: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              name="purpose"
              rows={2}
              placeholder="e.g. Onboarding kit for two new hires."
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={add}>
                <Plus className="h-4 w-4" />
                Add line
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const selected = items.find((it) => it.id === line.itemId)
                return (
                  <div
                    key={i}
                    className="grid gap-2 rounded-md border bg-card p-3 sm:grid-cols-[1fr_120px_auto]"
                  >
                    <div>
                      <Select
                        value={line.itemId}
                        onValueChange={(v) => update(i, { itemId: v })}
                        name="itemId"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((it) => (
                            <SelectItem key={it.id} value={it.id}>
                              <span className="flex items-center justify-between gap-3">
                                <span>{it.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {it.quantity} in stock
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selected && (
                        <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                          SKU {selected.sku ?? "—"} · {selected.quantity} available
                        </p>
                      )}
                    </div>
                    <Input
                      name="quantity"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        update(i, { quantity: Math.max(1, Number.parseInt(e.target.value || "1", 10)) })
                      }
                      aria-label="Quantity"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(i)}
                      disabled={lines.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/requests">Cancel</Link>
        </Button>
        <Button type="submit">Submit request</Button>
      </div>
    </form>
  )
}
