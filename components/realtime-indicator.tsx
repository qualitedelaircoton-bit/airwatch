"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeIndicatorProps {
  lastUpdate: Date
  lastWebhookUpdate?: any
  isConnected?: boolean
  className?: string
}

export function RealtimeIndicator({ 
  lastUpdate, 
  lastWebhookUpdate, 
  isConnected = true,
  className 
}: RealtimeIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)

  // Calculer le temps écoulé depuis la dernière mise à jour
  useEffect(() => {
    const updateTimeSince = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
      setTimeSinceUpdate(diff)
    }

    updateTimeSince()
    const interval = setInterval(updateTimeSince, 1000)

    return () => clearInterval(interval)
  }, [lastUpdate])

  // Animation de pulsation pour les mises à jour webhook
  useEffect(() => {
    if (lastWebhookUpdate) {
      setIsPulsing(true)
      const timer = setTimeout(() => setIsPulsing(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastWebhookUpdate])

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500'
    if (timeSinceUpdate < 60) return 'bg-green-500' // Moins d'1 minute
    if (timeSinceUpdate < 300) return 'bg-yellow-500' // Moins de 5 minutes
    return 'bg-red-500' // Plus de 5 minutes
  }

  const getStatusText = () => {
    if (!isConnected) return 'Déconnecté'
    if (timeSinceUpdate < 60) return 'Temps réel'
    if (timeSinceUpdate < 300) return 'Récent'
    return 'Délai'
  }

  const formatTimeSince = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h`
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Indicateur de statut */}
      <div className="flex items-center gap-1">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          getStatusColor(),
          isPulsing && "animate-pulse"
        )} />
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
      </div>

      {/* Icône de connexion */}
      {isConnected ? (
        <Wifi className="w-3 h-3 text-green-500" />
      ) : (
        <WifiOff className="w-3 h-3 text-red-500" />
      )}

      {/* Temps écoulé */}
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {formatTimeSince(timeSinceUpdate)}
        </span>
      </div>

      {/* Badge pour les mises à jour webhook */}
      {lastWebhookUpdate && (
        <Badge 
          variant="secondary" 
          className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
        >
          <Activity className="w-3 h-3 mr-1" />
          Webhook
        </Badge>
      )}
    </div>
  )
} 