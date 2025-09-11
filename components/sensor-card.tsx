"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Zap, Pencil, Trash2, ClipboardCopy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { formatFirestoreTimestamp } from "@/lib/date-utils"

export interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  frequency: number
  lastSeen: string | null | { seconds: number; nanoseconds: number }
  status: "GREEN" | "ORANGE" | "RED"
}

export interface SensorCardProps {
  sensor: Sensor
  index?: number
  isPopup?: boolean
  isAdmin?: boolean
  onEdit?: (sensor: Sensor) => void
  onDelete?: (sensor: Sensor) => void
  isSelected?: boolean
  onSelectionChange?: (id: string, isSelected: boolean) => void
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "GREEN": return <Activity className="w-4 h-4" />
    case "ORANGE": return <Zap className="w-4 h-4" />
    case "RED": return <AlertTriangle className="w-4 h-4" />
    default: return <AlertTriangle className="w-4 h-4" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "GREEN": return "En ligne"
    case "ORANGE": return "En retard"
    case "RED": return "Hors ligne"
    default: return "Inconnu"
  }
}


const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "GREEN": return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30"
    case "ORANGE": return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800/30"
    case "RED": return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30"
    default: return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-800/30"
  }
}

const getStatusIndicatorClass = (status: string) => {
  switch (status) {
    case "GREEN": return "bg-green-500 glow-green"
    case "ORANGE": return "bg-yellow-500 glow-orange"
    case "RED": return "glow-red"
    default: return "bg-gray-400"
  }
}

export function SensorCard({ 
  sensor, 
  index = 0,
  isAdmin,
  onEdit,
  onDelete,
  isPopup = false,
  isSelected = false,
  onSelectionChange
}: SensorCardProps) {
  const { toast } = useToast()

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleWrapperClick = (e: React.MouseEvent) => {
    if (isAdmin && onSelectionChange) {
      // Allow navigation if the user clicks on a link, otherwise select the card
      if ((e.target as HTMLElement).tagName !== 'A') {
        onSelectionChange(sensor.id, !isSelected)
      }
    }
  }

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    stopPropagation(e)
    action()
  }

  const copyToClipboard = (e: React.MouseEvent) => {
    handleActionClick(e, () => {
      navigator.clipboard.writeText(sensor.id)
      toast({
        title: "Copié !",
        description: "L'ID du capteur a été copié dans le presse-papiers.",
      })
    })
  }

  const cardContent = (
    <Card
      className={`sensor-card h-full flex flex-col glass-effect border-2 transition-all duration-300 group ${isPopup ? "border-none shadow-none bg-transparent" : "hover:border-primary/30"} ${isSelected ? 'border-primary shadow-lg' : ''}`}
      style={isPopup ? {} : { animationDelay: `${index * 0.05}s` }}
    >
      {isAdmin && onSelectionChange && (
        <div onClick={(e) => handleActionClick(e, () => onSelectionChange(sensor.id, !isSelected))} className="absolute top-3 right-3 z-20 p-2 cursor-pointer">
           <Checkbox
            checked={isSelected}
            aria-label={`Sélectionner le capteur ${sensor.name}`}
            className="w-5 h-5 rounded-md border-2 bg-background/50 backdrop-blur-sm pointer-events-none"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded-full shrink-0 mt-0.5 shadow-lg transition-all duration-300 group-hover:scale-110 ${getStatusIndicatorClass(sensor.status)}`}
            style={sensor.status === "RED" ? { backgroundColor: "var(--color-air-red)" } : {}}
          />
          <CardTitle className="text-base font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
            {sensor.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <div className="space-y-3 text-sm flex-grow">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Statut:</span>
            <Badge
              variant="secondary"
              className={`text-xs font-medium border-2 transition-all duration-300 group-hover:scale-105 ${getStatusBadgeClass(sensor.status)}`}
              style={sensor.status === "RED" ? { color: "var(--color-air-red)" } : {}}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(sensor.status)}
                {getStatusText(sensor.status)}
              </span>
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Dernière:</span>
            <div className="text-xs font-medium text-foreground">{formatFirestoreTimestamp(sensor.lastSeen, "dd/MM/yy HH:mm")}</div>
          </div>
          {isPopup && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Coordonnées:</span>
              <div className="text-xs font-medium text-foreground font-mono">{sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}</div>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-muted-foreground">Fréquence:</span>
            <span className="font-semibold text-primary">{sensor.frequency} min</span>
          </div>
        </div>
        {isAdmin && !isPopup && (
          <div className="mt-auto pt-4 border-t border-border/50 space-y-3 z-10 relative">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span className="select-all truncate" title={sensor.id}>{sensor.id}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                <ClipboardCopy className="h-4 w-4" /><span className="sr-only">Copier l'ID</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-full" onClick={(e) => handleActionClick(e, () => onEdit?.(sensor))}>
                <Pencil className="h-3.5 w-3.5 mr-2" />Modifier
              </Button>
              <Button variant="destructive" size="sm" className="w-full" onClick={(e) => handleActionClick(e, () => onDelete?.(sensor))}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />Supprimer
              </Button>
            </div>
          </div>
        )}
        {isPopup && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <Link href={`/sensors/${sensor.id}`} className="block w-full text-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs py-2.5 px-4 rounded-lg hover:scale-105 transition-all duration-200 font-medium shadow-lg border-2 border-primary hover:border-primary/80">
              📊 Voir les détails
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const linkWrapper = (
    <Link 
      href={`/sensors/${sensor.id}`} 
      className="h-full flex flex-col relative"
      onClick={handleWrapperClick}
    >
      {cardContent}
    </Link>
  )

  const divWrapper = (
    <div 
      className="h-full flex flex-col relative cursor-pointer"
      onClick={handleWrapperClick}
    >
      {cardContent}
    </div>
  )

  if (isPopup) return cardContent;
  
  // If admin is selecting, use a div wrapper to handle clicks.
  // Otherwise, use a Link wrapper for navigation.
  return isAdmin && onSelectionChange ? divWrapper : linkWrapper;
}