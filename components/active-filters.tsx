"use client"

import { Button } from "@/components/ui/button"
import { Filter, Clock, Activity, X } from "lucide-react"

interface ActiveFiltersProps {
  searchTerm: string
  statusFilter: string | null
  frequencyFilter: string | null
  activityFilter: string | null
  onClearSearch: () => void
  onClearStatusFilter: () => void
  onClearFrequencyFilter: () => void
  onClearActivityFilter: () => void
  onClearAllFilters: () => void
}

export function ActiveFilters({ 
  searchTerm,
  statusFilter,
  frequencyFilter,
  activityFilter,
  onClearSearch,
  onClearStatusFilter,
  onClearFrequencyFilter,
  onClearActivityFilter,
  onClearAllFilters
}: ActiveFiltersProps) {
  const hasFilters = searchTerm || statusFilter || frequencyFilter || activityFilter

  if (!hasFilters) {
    return null
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GREEN': return 'En ligne'
      case 'ORANGE': return 'En retard'
      case 'RED': return 'Hors ligne'
      default: return status
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'fast': return 'Rapide'
      case 'medium': return 'Moyenne'
      case 'slow': return 'Lente'
      default: return frequency
    }
  }

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case 'last-hour': return 'Dernière heure'
      case 'last-day': return 'Dernières 24h'
      case 'last-week': return 'Dernière semaine'
      case 'old': return 'Anciens'
      case 'never': return 'Jamais vu'
      default: return activity
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {searchTerm && (
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs whitespace-nowrap">
          <Filter className="w-3 h-3" />
          <span>"{searchTerm}"</span>
          <button
            onClick={onClearSearch}
            className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {statusFilter && (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap">
          <Filter className="w-3 h-3" />
          <span className="hidden sm:inline">
            {getStatusLabel(statusFilter)}
          </span>
          <span className="sm:hidden">
            {statusFilter === 'GREEN' ? 'Online' : statusFilter === 'ORANGE' ? 'Late' : 'Offline'}
          </span>
          <button
            onClick={onClearStatusFilter}
            className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {frequencyFilter && (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs whitespace-nowrap">
          <Clock className="w-3 h-3" />
          <span>{getFrequencyLabel(frequencyFilter)}</span>
          <button
            onClick={onClearFrequencyFilter}
            className="ml-1 hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      {activityFilter && (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-xs whitespace-nowrap">
          <Activity className="w-3 h-3" />
          <span>{getActivityLabel(activityFilter)}</span>
          <button
            onClick={onClearActivityFilter}
            className="ml-1 hover:bg-green-500/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAllFilters}
        className="px-2 py-1 h-auto text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X className="w-3 h-3 mr-1" />
        Effacer tout
      </Button>
    </div>
  )
} 