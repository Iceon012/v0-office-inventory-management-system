import type { ReactNode } from "react"
import { Package } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </span>
          Stockroom
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
