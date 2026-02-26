'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className="bg-muted/50 h-8 w-8 animate-pulse rounded-full" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground relative flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none"
    >
      {/* Sun — visible in dark mode */}
      <Sun
        className={`absolute h-[1.1rem] w-[1.1rem] transition-all duration-300 ${isDark ? 'scale-100 rotate-0 opacity-100 text-amber-500' : 'scale-75 -rotate-90 opacity-0'
          }`}
      />
      {/* Moon — visible in light mode */}
      <Moon
        className={`absolute h-[1.1rem] w-[1.1rem] transition-all duration-300 ${isDark ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100 text-slate-700'
          }`}
      />
    </button>
  )
}
