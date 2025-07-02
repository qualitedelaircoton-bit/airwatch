import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AirWatch Bénin - Surveillance de la Qualité de l\'Air',
    short_name: 'AirWatch Bénin',
    description: 'Plateforme de surveillance en temps réel de la qualité de l\'air au Bénin',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669', // Vert émeraude pour le thème environnemental
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['environment', 'monitoring', 'health'],
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-192x192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Tableau de bord AirWatch Bénin'
      },
      {
        src: '/screenshots/mobile-narrow.png',
        sizes: '375x812',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Vue mobile de la surveillance'
      }
    ]
  }
} 