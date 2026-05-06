import Link from "next/link"
import { and, desc, eq, ilike, lte, or, type SQL } from "drizzle-orm"
import { db, inventoryItems, categories } from "@/lib/db"
import { requireUser } from "@/lib/auth.server"
import { canManageInventory } from "@/lib/auth"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { StockBadge } from "@/components/app/stock-badge"
import { formatCurrency } from "@/lib/format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const dynamic = "force-dynamic"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; status?: string }>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const q = sp.q?.trim() ?? ""
  const cat = sp.cat ?? "all"
  const status = sp.status ?? "all"

  const allCategories = await db.select().from(categories).orderBy(categories.name)

  const conditions: SQL[] = []
  if (q) {
    conditions.push(or(ilike(inventoryItems.name, `%${q}%`), ilike(inventoryItems.sku, `%${q}%`))!)
  }
  if (cat !== "all") {
    conditions.push(eq(inventoryItems.categoryId, cat))
  }
  if (status === "low") {
    conditions.push(lte(inventoryItems.quantity, inventoryItems.minStock))
  }

  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      quantity: inventoryItems.quantity,
      minStock: inventoryItems.minStock,
      unitPrice: inventoryItems.unitPrice,
      location: inventoryItems.location,
      updatedAt: inventoryItems.updatedAt,
      categoryName: categories.name,
      categoryId: categories.id,
    })
    .from(inventoryItems)
    .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(inventoryItems.updatedAt))

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Browse, filter, and manage every item in stock."
        actions={
          canManageInventory(user.role) && (
            <Button asChild>
              <Link href="/inventory/new">
                <Plus className="h-4 w-4" />
                Add item
              </Link>
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <form className="relative flex-1" action="/inventory">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name or SKU…"
              className="pl-9"
            />
            {cat !== "all" && <input type="hidden" name="cat" value={cat} />}
            {status !== "all" && <input type="hidden" name="status" value={status} />}
          </form>
          <form action="/inventory" className="flex flex-wrap gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            <Select name="cat" defaultValue={cat}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {allCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={status}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="low">Low / out</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No items match your filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/inventory/${item.id}`} className="hover:underline">
                      {item.name}
                    </Link>
                    {item.location && (
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.categoryName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{item.sku ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {item.minStock}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <StockBadge quantity={item.quantity} minStock={item.minStock} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
