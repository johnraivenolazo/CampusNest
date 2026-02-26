import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams
  const errorMessage = params?.error
    ? decodeURIComponent(params.error).replace(/_/g, ' ')
    : 'An unexpected error occurred.'

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
          <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground mt-2 text-sm capitalize">{errorMessage}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              asChild
              className="w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
            >
              <Link href="/auth/login">Try logging in again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to listings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
