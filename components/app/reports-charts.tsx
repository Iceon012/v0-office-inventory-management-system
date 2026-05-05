"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const trendConfig = {
  count: { label: "Requests", color: "var(--chart-1)" },
} satisfies ChartConfig

const itemsConfig = {
  total: { label: "Units requested", color: "var(--chart-2)" },
} satisfies ChartConfig

export function ReportsCharts({
  trend,
  topItems,
}: {
  trend: { day: string; count: number }[]
  topItems: { name: string | null; total: number }[]
}) {
  const items = topItems.map((i) => ({ name: i.name ?? "—", total: i.total }))
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No requests in the last 30 days.
            </p>
          ) : (
            <ChartContainer config={trendConfig} className="h-[260px] w-full">
              <AreaChart data={trend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#trend-grad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top requested items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing has been requested yet.
            </p>
          ) : (
            <ChartContainer config={itemsConfig} className="h-[260px] w-full">
              <BarChart data={items} layout="vertical" margin={{ left: 12, right: 12, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.4} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
