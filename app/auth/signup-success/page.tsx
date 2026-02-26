import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2.5">
          <div className="relative h-12 w-12">
            <Image src="/logo.png" alt="CampusNest" fill className="object-contain" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Campus<span className="text-amber-500">Nest</span>
          </span>
        </Link>

        <div className="bg-card border-border space-y-4 rounded-2xl border p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">Account created!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Check your email to confirm your account before signing in.
            </p>
          </div>
          <Button
            asChild
            className="w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
          >
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>

        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground block text-xs transition-colors"
        >
          ← Browse listings while you wait
        </Link>
      </div>
    </div>
  )
}
