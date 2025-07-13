"use client"

interface StatusIndicatorsProps {
  statusCounts: {
    GREEN: number
    ORANGE: number
    RED: number
  }
  onStatusFilter?: (status: string | null) => void
  activeFilter?: string | null
}

export function StatusIndicators({ statusCounts, onStatusFilter, activeFilter }: StatusIndicatorsProps) {
  return (
    <div className="flex flex-nowrap gap-2 sm:gap-4 text-sm overflow-x-auto">
      <div 
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30 whitespace-nowrap ${
          onStatusFilter ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors' : ''
        } ${activeFilter === 'GREEN' ? 'ring-2 ring-green-500' : ''}`}
        onClick={() => onStatusFilter?.(activeFilter === 'GREEN' ? null : 'GREEN')}
      >
        <div className="w-3 h-3 rounded-full bg-green-500 glow-green hidden sm:block"></div>
        <span className="font-medium text-green-700 dark:text-green-300">{statusCounts.GREEN} en ligne</span>
      </div>
      <div 
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-full bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30 whitespace-nowrap ${
          onStatusFilter ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors' : ''
        } ${activeFilter === 'ORANGE' ? 'ring-2 ring-yellow-500' : ''}`}
        onClick={() => onStatusFilter?.(activeFilter === 'ORANGE' ? null : 'ORANGE')}
      >
        <div className="w-3 h-3 rounded-full bg-yellow-500 glow-orange hidden sm:block"></div>
        <span className="font-medium text-yellow-700 dark:text-yellow-300">{statusCounts.ORANGE} en retard</span>
      </div>
      <div 
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-full bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/30 whitespace-nowrap ${
          onStatusFilter ? 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors' : ''
        } ${activeFilter === 'RED' ? 'ring-2 ring-red-500' : ''}`}
        onClick={() => onStatusFilter?.(activeFilter === 'RED' ? null : 'RED')}
      >
        <div 
          className="w-3 h-3 rounded-full glow-red hidden sm:block" 
          style={{ backgroundColor: "var(--color-air-red)" }}
        ></div>
        <span 
          className="font-medium dark:text-red-300" 
          style={{ color: "var(--color-air-red)" }}
        >
          {statusCounts.RED} hors ligne
        </span>
      </div>
    </div>
  )
} 