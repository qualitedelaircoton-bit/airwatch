import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/contexts/auth-context'

import { startServices } from "@/lib/startup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AirWatch Bénin - Surveillance de la Qualité de l'Air",
  description: "Plateforme de surveillance en temps réel de la qualité de l'air au Bénin",
  keywords: ["qualité de l'air", "Bénin", "surveillance", "environnement", "pollution"],
  generator: 'Next.js',
  applicationName: 'AirWatch Bénin',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'AirWatch Bénin Team' }],
  creator: 'AirWatch Bénin',
  publisher: 'AirWatch Bénin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AirWatch Bénin',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#10b981' },
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

// Démarrer les services au démarrage de l'application
if (typeof window === "undefined") {
  startServices()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
