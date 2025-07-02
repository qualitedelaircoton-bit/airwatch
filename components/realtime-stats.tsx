"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeStatsProps {
  sensors: any[]
  lastWebhookUpdate?: any
  className?: string
}

export function RealtimeStats({ sensors, lastWebhookUpdate, className }: RealtimeStatsProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Animation quand on reçoit une mise à jour webhook
  useEffect(() => {
    if (lastWebhookUpdate) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [lastWebhookUpdate])

  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.status !== 'RED').length,
    green: sensors.filter(s => s.status === 'GREEN').length,
    orange: sensors.filter(s => s.status === 'ORANGE').length,
    red: sensors.filter(s => s.status === 'RED').length,
    recent: sensors.filter(s => {
      if (!s.lastSeen) return false
      const lastSeen = new Date(s.lastSeen)
      const now = new Date()
      return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000 // 5 minutes
    }).length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GREEN':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      case 'ORANGE':
        return <Minus className="w-4 h-4 text-yellow-500" />
      case 'RED':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {/* Total des capteurs */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">capteurs</p>
        </CardContent>
      </Card>

      {/* Capteurs actifs */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">en ligne</p>
        </CardContent>
      </Card>

      {/* Statut Vert */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            {getStatusIcon('GREEN')}
            Vert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.green}</div>
          <p className="text-xs text-muted-foreground">bonne qualité</p>
        </CardContent>
      </Card>

      {/* Statut Orange */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            {getStatusIcon('ORANGE')}
            Orange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.orange}</div>
          <p className="text-xs text-muted-foreground">modérée</p>
        </CardContent>
      </Card>

      {/* Statut Rouge */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            {getStatusIcon('RED')}
            Rouge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.red}</div>
          <p className="text-xs text-muted-foreground">dégradée</p>
        </CardContent>
      </Card>

      {/* Récent */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "scale-105 shadow-lg"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Activity className="w-4 h-4 text-blue-500" />
            Récent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
          <p className="text-xs text-muted-foreground">5min</p>
        </CardContent>
      </Card>
    </div>
  )
} 