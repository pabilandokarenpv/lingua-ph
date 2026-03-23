import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import { OfflineBanner } from '@/components/OfflineBanner'
import { BottomNav } from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Lingua PH — Philippine Indigenous Languages',
  description: 'Preserve and learn Philippine indigenous languages through community-powered documentation.',
  manifest: '/manifest.json',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Lingua PH' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <OfflineBanner />
          <main className="max-w-[430px] mx-auto pb-20">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
