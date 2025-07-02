import { useState, useEffect, useCallback } from 'react'

interface RealtimeUpdate {
  sensorId: string
  data: any
  timestamp: Date
}

interface UseRealtimeUpdatesOptions {
  onWebhookUpdate?: (update: RealtimeUpdate) => void
  enablePolling?: boolean
  pollingInterval?: number
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    onWebhookUpdate,
    enablePolling = false,
    pollingInterval = 0
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

  // Vérification des mises à jour webhook seulement si activé
  useEffect(() => {
    if (!enablePolling) return

    const checkForWebhookUpdates = async () => {
      try {
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
            // Déclencher une mise à jour webhook simulée
            const update: RealtimeUpdate = {
              sensorId: 'webhook-update',
              data: { timestamp: new Date(data.lastWebhookUpdate) },
              timestamp: new Date(data.lastWebhookUpdate)
            }
            setLastWebhookUpdate(update)
            onWebhookUpdate?.(update)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error)
      }
    }

    // Vérifier les mises à jour webhook toutes les 5 secondes seulement si activé
    const webhookInterval = setInterval(checkForWebhookUpdates, 5000)

    return () => clearInterval(webhookInterval)
  }, [lastUpdate, onWebhookUpdate, enablePolling])

  return {
    lastUpdate,
    lastWebhookUpdate,
    isConnected,
    forceUpdate,
    simulateWebhookUpdate
  }
} 