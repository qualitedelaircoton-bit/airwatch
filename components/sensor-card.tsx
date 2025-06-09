"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Zap } from "lucide-react"
import Link from "next/link"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  frequency: number
  lastSeen: string | null
  status: "GREEN" | "ORANGE" | "RED"
}

interface SensorCardProps {
  sensor: Sensor
  index?: number
  isPopup?: boolean
  showActions?: boolean
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "GREEN":
      return <Activity className="w-4 h-4" />
    case "ORANGE":
      return <Zap className="w-4 h-4" />
    case "RED":
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <AlertTriangle className="w-4 h-4" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "GREEN":
      return "En ligne"
    case "ORANGE":
      return "En retard"
    case "RED":
      return "Hors ligne"
    default:
      return "Inconnu"
  }
}

const formatLastSeen = (lastSeen: string | null) => {
  if (!lastSeen) return "Jamais vu"
  return new Date(lastSeen).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "GREEN":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30"
    case "ORANGE":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800/30"
    case "RED":
      return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30"
      // Utilisation de la couleur CSS custom pour le texte rouge vif
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-800/30"
  }
}

const getStatusIndicatorClass = (status: string) => {
  switch (status) {
    case "GREEN":
      return "bg-green-500 glow-green"
    case "ORANGE":
      return "bg-yellow-500 glow-orange"
    case "RED":
      return "glow-red"
      // Utilisation de la couleur CSS custom pour le fond rouge vif
    default:
      return "bg-gray-400"
  }
}

export function SensorCard({ sensor, index = 0, isPopup = false, showActions = true }: SensorCardProps) {
  const cardContent = (
    <Card
      className={`sensor-card h-full glass-effect border-2 ${
        !isPopup ? "hover:border-primary/30 group" : ""
      } ${isPopup ? "border-none shadow-none bg-transparent" : ""}`}
      style={isPopup ? {} : { animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded-full shrink-0 mt-0.5 shadow-lg transition-all duration-300 ${
              !isPopup ? "group-hover:scale-110" : ""
            } ${getStatusIndicatorClass(sensor.status)}`}
            style={
              sensor.status === "RED"
                ? { backgroundColor: "var(--color-air-red)" }
                : {}
            }
          />
          <CardTitle className={`text-base font-semibold line-clamp-2 leading-tight ${
            !isPopup ? "group-hover:text-primary" : ""
          } transition-colors duration-300`}>
            {sensor.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Statut:</span>
          <Badge
            variant="secondary"
            className={`text-xs font-medium border-2 transition-all duration-300 ${
              !isPopup ? "group-hover:scale-105" : ""
            } ${getStatusBadgeClass(sensor.status)}`}
            style={
              sensor.status === "RED"
                ? { color: "var(--color-air-red)" }
                : {}
            }
          >
            <span className="flex items-center gap-1">
              {getStatusIcon(sensor.status)}
              {getStatusText(sensor.status)}
            </span>
          </Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Dernière:</span>
            <div className="text-xs font-medium text-foreground">
              {formatLastSeen(sensor.lastSeen)}
            </div>
          </div>

          {isPopup && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Coordonnées:</span>
              <div className="text-xs font-medium text-foreground font-mono">
                {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-muted-foreground">Fréquence:</span>
            <span className="font-semibold text-primary">{sensor.frequency} min</span>
          </div>
        </div>

        {isPopup && showActions && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <Link 
              href={`/sensors/${sensor.id}`}
              className="block w-full text-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs py-2.5 px-4 rounded-lg hover:scale-105 transition-all duration-200 font-medium shadow-lg border-2 border-primary hover:border-primary/80"
            >
              📊 Voir les détails
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isPopup) {
    return cardContent
  }

  return (
    <Link href={`/sensors/${sensor.id}`}>
      {cardContent}
    </Link>
  )
} 