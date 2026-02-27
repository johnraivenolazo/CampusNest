'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LogOut, LayoutDashboard, Bookmark, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthDialog } from '@/components/auth-dialog'

export default function Header({ user }: { user: User | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  const openAuth = (view: 'login' | 'signup') => {
    setAuthView(view)
    setAuthOpen(true)
  }

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const isLandlord = user?.user_metadata?.user_type === 'landlord'
  const isStudent = user?.user_metadata?.user_type === 'student'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'

  return (
    <header className="border-border/60 bg-background/90 supports-backdrop-filter:bg-background/75 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-5 md:px-10">
        {/* Logo + Wordmark */}
        <Link href="/" className="group flex items-center gap-2.5 select-none">
          <div className="relative h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="CampusNest Logo"
              fill
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-foreground text-[17px] font-extrabold tracking-tight">
              Campus<span className="text-amber-500">Nest</span>
            </span>
            <span className="text-muted-foreground hidden text-[10px] font-medium tracking-widest uppercase sm:block">
              Find Your Next Stay
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {/* Theme toggle — always visible, best spot before user actions */}
          <ThemeToggle />
          {user ? (
            <>
              {isLandlord && (
                <Link
                  href="/landlord/dashboard"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${pathname?.startsWith('/landlord')
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  My Listings
                </Link>
              )}
              {isStudent && (
                <Link
                  href="/student/saved"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${pathname?.startsWith('/student')
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved
                </Link>
              )}


              {/* User menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="border-border bg-muted/50 hover:bg-muted flex items-center gap-2 rounded-full border py-1.5 pr-2 pl-3 text-sm font-medium transition-colors"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-muted-foreground hidden max-w-[120px] truncate lg:block">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`text-muted-foreground h-3.5 w-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div className="border-border bg-popover animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border shadow-xl duration-150">
                    <div className="border-border bg-muted/30 border-b px-4 py-3">
                      <p className="text-muted-foreground text-xs">Signed in as</p>
                      <p className="truncate text-sm font-semibold">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-700 uppercase dark:bg-amber-950 dark:text-amber-400">
                        {user.user_metadata?.user_type || 'User'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        handleLogout()
                      }}
                      disabled={isLoading}
                      className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoading ? 'Logging out…' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuth('login')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Log in
              </button>
              <Button
                onClick={() => openAuth('signup')}
                size="sm"
                className="bg-amber-500 font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                Sign Up Now
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile: auth buttons only */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {user ? (
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground border-border hover:bg-muted flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isLoading ? '…' : 'Log out'}
            </button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => openAuth('login')}>
                Log in
              </Button>
              <Button
                onClick={() => openAuth('signup')}
                size="sm"
                className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultView={authView} />
    </header>
  )
}
