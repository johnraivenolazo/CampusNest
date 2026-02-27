import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

import { createClient } from '@/lib/supabase/server'
import MessagingOverlay from '@/components/messaging-overlay'

export const metadata: Metadata = {
  title: 'CampusNest - Find student housing near your campus',
  description:
    'Search for verified student housing, dorms, and rooms near your campus with real-time availability and direct landlord messaging.',
  keywords: 'student housing, dorms, rooms for rent, campus living, verified rentals',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    title: 'CampusNest - Campus Living',
    description: 'Find verified student housing near your campus',
    type: 'website',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'CampusNest Logo' }],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <MessagingOverlay user={user} />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
