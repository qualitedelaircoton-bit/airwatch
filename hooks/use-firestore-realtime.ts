import { useState, useEffect, useCallback } from 'react'
import { collection, query, onSnapshot, orderBy, limit, doc, Timestamp, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface SensorUpdate {
  id: string
  lastSeen: Timestamp
  status: 'GREEN' | 'ORANGE' | 'RED'
  isActive: boolean
  name: string
}

interface DataUpdate {
  sensorId: string
  timestamp: Timestamp
  data: any
}

interface UseFirestoreRealtimeOptions {
  onSensorUpdate?: (sensor: SensorUpdate) => void
  onDataUpdate?: (data: DataUpdate) => void
  onSensorStatusChange?: (sensorId: string, newStatus: string) => void
  enabled?: boolean
}

export function useFirestoreRealtime(options: UseFirestoreRealtimeOptions = {}) {
  const { onSensorUpdate, onDataUpdate, onSensorStatusChange, enabled = true } = options
  
  const [sensors, setSensors] = useState<SensorUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [lastDataReceived, setLastDataReceived] = useState<DataUpdate | null>(null)

  // Hook pour écouter les changements de capteurs en temps réel
  useEffect(() => {
    if (!enabled || !db) {
      return; // Do not subscribe if disabled or Firestore not ready
    }

    console.log('🔥 Démarrage de l\'écoute Firestore temps réel...')

    const sensorsQuery = query(
      collection(db, 'sensors'),
      orderBy('lastSeen', 'desc')
    )

    const unsubscribe = onSnapshot(
      sensorsQuery,
      (snapshot) => {
        setIsConnected(true)
        setLastUpdate(new Date())
        
        const updatedSensors: SensorUpdate[] = []
        const changes = snapshot.docChanges()
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          const sensor: SensorUpdate = {
            id: doc.id,
            lastSeen: data.lastSeen,
            status: data.status,
            isActive: data.isActive,
            name: data.name
          }
          updatedSensors.push(sensor)
        })
        
        setSensors(updatedSensors)
        
        // Détecter les changements de statut
        changes.forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data()
            const sensorId = change.doc.id
            
            console.log(`🔄 Capteur ${data.name} (${sensorId}) mis à jour: ${data.status}`)
            
            onSensorUpdate?.({
              id: sensorId,
              lastSeen: data.lastSeen,
              status: data.status,
              isActive: data.isActive,
              name: data.name
            })
            
            onSensorStatusChange?.(sensorId, data.status)
          }
        })
        
        console.log(`✅ ${updatedSensors.length} capteurs mis à jour via Firestore`)
      },
      (error) => {
        console.error('❌ Erreur écoute Firestore:', error)
        setIsConnected(false)
      }
    )

    return () => {
      console.log('🛑 Arrêt de l\'écoute Firestore')
      unsubscribe()
    }
  }, [onSensorUpdate, onSensorStatusChange, enabled])

  // Hook pour écouter les nouvelles données de capteurs
  const subscribeToSensorData = useCallback((sensorId: string) => {
    if (!db) return () => {};

    const dataQuery = query(
      collection(db, `sensors/${sensorId}/sensorData`),
      orderBy('timestamp', 'desc'),
      limit(1)
    )

    return onSnapshot(
      dataQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data()
            const update: DataUpdate = {
              sensorId,
              timestamp: data.timestamp,
              data: data
            }
            
            setLastDataReceived(update)
            setLastUpdate(new Date())
            
            console.log(`📊 Nouvelles données reçues pour ${sensorId}`)
            onDataUpdate?.(update)
          }
        })
      },
      (error) => {
        console.error(`❌ Erreur écoute données ${sensorId}:`, error)
      }
    )
  }, [onDataUpdate])

  // Fonction pour écouter les notifications admin en temps réel
  const subscribeToAdminNotifications = useCallback(() => {
    if (!db) return () => {};

    const notificationsQuery = query(
      collection(db, 'admin_notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        console.log(`🔔 ${newNotifications.length} notifications non lues`)
        // Émettre un événement personnalisé pour les notifications
        window.dispatchEvent(new CustomEvent('firestore-notifications', {
          detail: { notifications: newNotifications }
        }))
      },
      (error) => {
        console.error('❌ Erreur écoute notifications:', error)
      }
    )
  }, [])

  // Fonction pour forcer une mise à jour
  const forceUpdate = useCallback(() => {
    setLastUpdate(new Date())
  }, [])

  return {
    sensors,
    lastUpdate,
    lastDataReceived,
    isConnected,
    forceUpdate,
    subscribeToSensorData,
    subscribeToAdminNotifications
  }
}

// Hook simplifié pour les composants qui ont juste besoin d'écouter les capteurs
export function useSensorsRealtime() {
  const [sensors, setSensors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'sensors'),
      (snapshot) => {
        const sensorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSensors(sensorsData)
        setLoading(false)
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des capteurs:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  return { sensors, loading }
}
