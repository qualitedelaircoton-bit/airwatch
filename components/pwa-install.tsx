'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkIfInstalled()

    // Enregistrer le service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
          })
          
          console.log('Service Worker enregistré avec succès:', registration)
          
          // Vérifier les mises à jour du service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nouvelle version disponible')
                  // Vous pouvez afficher une notification pour recharger l'app
                }
              })
            }
          })
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement du Service Worker:', error)
        }
      }
    }

    registerServiceWorker()

    // Gérer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Gérer l'installation réussie
    const handleAppInstalled = () => {
      console.log('PWA installée avec succès')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Installation acceptée')
      } else {
        console.log('Installation refusée')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  // Instructions spécifiques pour iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (isInstalled) {
    return null // Ne rien afficher si l'app est déjà installée
  }

  if (isIOS && !isInstalled) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Installer AirWatch Bénin</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Pour installer cette app sur votre iPhone : tapez sur 
              <span className="mx-1 px-1 bg-blue-100 dark:bg-blue-900 rounded">⬆️</span>
              puis "Sur l'écran d'accueil"
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-sm">Installer AirWatch Bénin</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Accès rapide depuis votre écran d'accueil
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Plus tard
            </Button>
            <Button size="sm" onClick={handleInstallClick} className="bg-green-600 hover:bg-green-700">
              Installer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
} 