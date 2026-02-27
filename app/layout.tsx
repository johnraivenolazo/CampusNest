import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
