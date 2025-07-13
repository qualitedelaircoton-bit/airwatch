"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"

interface AdvancedFiltersProps {
  frequencyFilter: string | null
  activityFilter: string | null
  onFrequencyFilterChange: (filter: string | null) => void
  onActivityFilterChange: (filter: string | null) => void
  disabled?: boolean
}

export function AdvancedFilters({ 
  frequencyFilter, 
  activityFilter, 
  onFrequencyFilterChange, 
  onActivityFilterChange,
  disabled = false 
}: AdvancedFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled}
          className={`border-2 transition-all duration-300 ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-accent/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres
          {(frequencyFilter || activityFilter) && (
            <div className="ml-2 w-2 h-2 rounded-full bg-primary"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
          Fréquence d'envoi
        </div>
        <DropdownMenuCheckboxItem
          checked={frequencyFilter === "fast"}
          onCheckedChange={(checked) => onFrequencyFilterChange(checked ? "fast" : null)}
        >
          Rapide (≤ 10 min)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={frequencyFilter === "medium"}
          onCheckedChange={(checked) => onFrequencyFilterChange(checked ? "medium" : null)}
        >
          Moyenne (10-20 min)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={frequencyFilter === "slow"}
          onCheckedChange={(checked) => onFrequencyFilterChange(checked ? "slow" : null)}
        >
          Lente (&gt; 20 min)
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
          Dernière activité
        </div>
        <DropdownMenuCheckboxItem
          checked={activityFilter === "last-hour"}
          onCheckedChange={(checked) => onActivityFilterChange(checked ? "last-hour" : null)}
        >
          Dernière heure
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activityFilter === "last-day"}
          onCheckedChange={(checked) => onActivityFilterChange(checked ? "last-day" : null)}
        >
          Dernières 24h
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activityFilter === "last-week"}
          onCheckedChange={(checked) => onActivityFilterChange(checked ? "last-week" : null)}
        >
          Dernière semaine
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activityFilter === "old"}
          onCheckedChange={(checked) => onActivityFilterChange(checked ? "old" : null)}
        >
          Plus d'une semaine
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={activityFilter === "never"}
          onCheckedChange={(checked) => onActivityFilterChange(checked ? "never" : null)}
        >
          Jamais vu
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 