// DEPRECATED: Ce hook est remplacé par use-firestore-realtime.ts
// Gardé pour la compatibilité, redirige vers Firestore real-time

import { useFirestoreRealtime } from './use-firestore-realtime'
import { useCallback } from 'react'

interface RealtimeUpdate {
  sensorId: string
  data: any
  timestamp: Date
}

interface UseRealtimeUpdatesOptions {
  onWebhookUpdate?: (update: RealtimeUpdate) => void
  enablePolling?: boolean // Ignoré - Firestore real-time ne fait pas de polling
  pollingInterval?: number // Ignoré - Firestore real-time est instantané
  enabled?: boolean
}

/**
 * @deprecated Utilisez useFirestoreRealtime ou useSensorsRealtime à la place
 * Hook de compatibilité qui redirige vers Firestore real-time
 */
export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { onWebhookUpdate, enabled = true } = options

  // Redirection vers le nouveau hook Firestore
  const {
    lastUpdate,
    lastDataReceived,
    isConnected,
    forceUpdate
  } = useFirestoreRealtime({
    onDataUpdate: (dataUpdate) => {
      // Adapter le format pour l'ancien hook
      if (onWebhookUpdate) {
        const update: RealtimeUpdate = {
          sensorId: dataUpdate.sensorId,
          data: dataUpdate.data,
          timestamp: new Date(dataUpdate.timestamp.seconds * 1000)
        }
        onWebhookUpdate(update)
      }
    },
    enabled
  })

  // Fonction de simulation pour compatibilité (plus nécessaire avec Firestore real-time)
  const simulateWebhookUpdate = useCallback((sensorId: string, data: any) => {
    console.warn('simulateWebhookUpdate est deprecated - Firestore real-time est automatique')
    if (onWebhookUpdate) {
      const update: RealtimeUpdate = {
        sensorId,
        data,
        timestamp: new Date()
      }
      onWebhookUpdate(update)
    }
  }, [onWebhookUpdate])

  // Adapter le format pour compatibilité
  const lastWebhookUpdate = lastDataReceived ? {
    sensorId: lastDataReceived.sensorId,
    data: lastDataReceived.data,
    timestamp: new Date(lastDataReceived.timestamp.seconds * 1000)
  } : null

  return {
    lastUpdate,
    lastWebhookUpdate,
    isConnected,
    forceUpdate,
    simulateWebhookUpdate
  }
} 