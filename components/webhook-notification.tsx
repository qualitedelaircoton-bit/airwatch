"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, Activity, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WebhookNotificationProps {
  lastWebhookUpdate: any
  onDismiss?: () => void
}

export function WebhookNotification({ lastWebhookUpdate, onDismiss }: WebhookNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (lastWebhookUpdate) {
      setIsVisible(true)
      setIsAnimating(true)
      
      // Animation d'entrée
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 500)

      // Auto-dismiss après 5 secondes
      const dismissTimer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, 5000)

      return () => {
        clearTimeout(timer)
        clearTimeout(dismissTimer)
      }
    }
  }, [lastWebhookUpdate, onDismiss])

  if (!isVisible || !lastWebhookUpdate) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-500 ease-in-out",
      isAnimating ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
    )}>
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 shadow-lg">
        <div className="flex items-start gap-3">
          <Activity className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertDescription className="text-sm text-green-800 dark:text-green-200">
              <strong>Données reçues !</strong>
              <br />
              Nouvelles données du capteur <strong>{lastWebhookUpdate.data?.sensorName || lastWebhookUpdate.sensorId}</strong>
              <br />
              <span className="text-xs opacity-75">
                {lastWebhookUpdate.timestamp.toLocaleTimeString('fr-FR')}
              </span>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  )
} 