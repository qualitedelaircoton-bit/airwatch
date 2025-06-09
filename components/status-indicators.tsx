"use client"

interface StatusCounts {
  GREEN: number
  ORANGE: number
  RED: number
}

interface StatusIndicatorsProps {
  statusCounts: StatusCounts
}

export function StatusIndicators({ statusCounts }: StatusIndicatorsProps) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
        <div className="w-3 h-3 rounded-full bg-green-500 glow-green"></div>
        <span className="font-medium text-green-700 dark:text-green-300">{statusCounts.GREEN} en ligne</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30">
        <div className="w-3 h-3 rounded-full bg-yellow-500 glow-orange"></div>
        <span className="font-medium text-yellow-700 dark:text-yellow-300">{statusCounts.ORANGE} en retard</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/30">
        <div 
          className="w-3 h-3 rounded-full glow-red" 
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