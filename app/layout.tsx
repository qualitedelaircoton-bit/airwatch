import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { startServices } from "@/lib/startup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AirWatch Bénin - Surveillance de la Qualité de l'Air",
  description: "Plateforme de surveillance en temps réel de la qualité de l'air au Bénin",
  keywords: ["qualité de l'air", "Bénin", "surveillance", "environnement", "pollution"],
    generator: 'v0.dev'
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
