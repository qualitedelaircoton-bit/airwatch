import { useState, useEffect, useCallback } from 'react'

interface RealtimeUpdate {
  sensorId: string
  data: any
  timestamp: Date
}

interface UseRealtimeUpdatesOptions {
  onWebhookUpdate?: (update: RealtimeUpdate) => void
  onStatusUpdate?: () => void
  enablePolling?: boolean
  pollingInterval?: number
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    onWebhookUpdate,
    onStatusUpdate,
    enablePolling = true,
    pollingInterval = 30000
  } = options

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [lastWebhookUpdate, setLastWebhookUpdate] = useState<RealtimeUpdate | null>(null)

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    setLastUpdate(new Date())
  }, [])

  // Fonction pour simuler une mise à jour webhook (pour les tests)
  const simulateWebhookUpdate = useCallback((sensorId: string, data: any) => {
    const update: RealtimeUpdate = {
      sensorId,
      data,
      timestamp: new Date()
    }
    setLastWebhookUpdate(update)
    setLastUpdate(new Date())
    onWebhookUpdate?.(update)
  }, [onWebhookUpdate])

  useEffect(() => {
    if (!enablePolling) return

    // Polling automatique
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      onStatusUpdate?.()
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [enablePolling, pollingInterval, onStatusUpdate])

  // Écouter les événements de mise à jour webhook (si on était côté serveur)
  useEffect(() => {
    // En production, on pourrait utiliser WebSocket ou Server-Sent Events ici
    // Pour l'instant, on se contente du polling avec une optimisation
    
    const checkForWebhookUpdates = async () => {
      try {
        // Vérifier s'il y a eu des mises à jour récentes via une API
        const response = await fetch('/api/sensors/last-updates', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.lastWebhookUpdate && data.lastWebhookUpdate > lastUpdate.getTime()) {
            setLastUpdate(new Date())
            onStatusUpdate?.()
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error)
      }
    }

    // Vérifier les mises à jour webhook plus fréquemment
    const webhookInterval = setInterval(checkForWebhookUpdates, 5000) // Toutes les 5 secondes

    return () => clearInterval(webhookInterval)
  }, [lastUpdate, onStatusUpdate])

  return {
    lastUpdate,
    lastWebhookUpdate,
    isConnected,
    forceUpdate,
    simulateWebhookUpdate
  }
} 