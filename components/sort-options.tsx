"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Clock, SortAsc, SortDesc } from "lucide-react"

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'frequency-asc' | 'frequency-desc'

interface SortOptionsProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortOptions({ sortBy, onSortChange }: SortOptionsProps) {
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'newest': return 'Plus récent'
      case 'oldest': return 'Plus ancien'
      case 'name-asc': return 'Nom A-Z'
      case 'name-desc': return 'Nom Z-A'
      case 'frequency-asc': return 'Fréquence ↑'
      case 'frequency-desc': return 'Fréquence ↓'
      default: return 'Trier par'
    }
  }

  const getSortIcon = (sort: SortOption) => {
    switch (sort) {
      case 'newest':
      case 'oldest':
        return <Clock className="w-4 h-4" />
      case 'name-asc':
        return <SortAsc className="w-4 h-4" />
      case 'name-desc':
        return <SortDesc className="w-4 h-4" />
      case 'frequency-asc':
      case 'frequency-desc':
        return <ArrowUpDown className="w-4 h-4" />
      default:
        return <ArrowUpDown className="w-4 h-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-2 hover:bg-accent/50 transition-all duration-300"
        >
          {getSortIcon(sortBy)}
          <span className="ml-2 hidden sm:inline">{getSortLabel(sortBy)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onSortChange('newest')}>
          <Clock className="w-4 h-4 mr-2" />
          Plus récent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('oldest')}>
          <Clock className="w-4 h-4 mr-2" />
          Plus ancien
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('name-asc')}>
          <SortAsc className="w-4 h-4 mr-2" />
          Nom A-Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('name-desc')}>
          <SortDesc className="w-4 h-4 mr-2" />
          Nom Z-A
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('frequency-asc')}>
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Fréquence croissante
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange('frequency-desc')}>
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Fréquence décroissante
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 