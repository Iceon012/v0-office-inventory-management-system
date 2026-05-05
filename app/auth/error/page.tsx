import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </div>
        <CardTitle>Authentication error</CardTitle>
        <CardDescription>{message ?? "Something went wrong while signing you in. Please try again."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  )
}
