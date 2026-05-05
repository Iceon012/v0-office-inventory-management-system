import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent you a confirmation link. Click the link in the email to verify your account, then return to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  )
}
