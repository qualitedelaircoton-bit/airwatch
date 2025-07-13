"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Download, Search, Activity, Grid3X3, MapPin } from "lucide-react"
import Link from "next/link"
import { MapView } from "@/components/map-view"
import { DataDownloadModal } from "@/components/data-download-modal"
import AddSensorModal from "@/components/add-sensor-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { SensorCard } from "@/components/sensor-card"
import { StatusIndicators } from "@/components/status-indicators"
import { ProjectDescription } from "@/components/project-description"
import { PWAInstall } from "@/components/pwa-install"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import { WebhookNotification } from "@/components/webhook-notification"
import { AdvancedFilters } from "@/components/advanced-filters"
import { ActiveFilters } from "@/components/active-filters"
import { SortOptions, type SortOption } from "@/components/sort-options"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  frequency: number
  lastSeen: string | null
  status: "GREEN" | "ORANGE" | "RED"
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [frequencyFilter, setFrequencyFilter] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false)

  // Protection d'authentification
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/landing')
        return
      }
      
      if (!user.emailVerified) {
        router.push('/auth/verify-email')
        return
      }
      
      if (!userProfile?.isApproved) {
        router.push('/auth/pending-approval')
        return
      }
    }
  }, [user, userProfile, authLoading, router])

  // Gérer les paramètres URL pour centrer la carte
  const urlView = searchParams.get('view')
  const urlCenter = searchParams.get('center')
  const urlZoom = searchParams.get('zoom')

  const fetchSensors = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await fetch("/api/sensors", {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      setSensors(data)
    } catch (error) {
      console.error("Error fetching sensors:", error)
    } finally {
      setLoading(false)
    }
  }

  // Hook temps réel - seulement pour les webhooks, pas de polling
  const { lastUpdate, lastWebhookUpdate, forceUpdate } = useRealtimeUpdates({
    onWebhookUpdate: (update) => {
      console.log("🚀 Mise à jour webhook reçue:", update)
      // Mise à jour immédiate quand on reçoit un webhook
      fetchSensors()
    },
    enablePolling: false, // Pas de polling automatique
    pollingInterval: 0
  })

  useEffect(() => {
    fetchSensors(true)
  }, [])

  // Définir le mode de vue basé sur l'URL
  useEffect(() => {
    if (urlView === 'map') {
      setViewMode('map')
    }
  }, [urlView])

  const filteredSensors = sensors.filter((sensor) => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || sensor.status === statusFilter
    
    // Filtre par fréquence
    const matchesFrequency = !frequencyFilter || 
      (frequencyFilter === "fast" && sensor.frequency <= 10) ||
      (frequencyFilter === "medium" && sensor.frequency > 10 && sensor.frequency <= 20) ||
      (frequencyFilter === "slow" && sensor.frequency > 20)
    
    // Filtre par activité (basé sur lastSeen)
    const matchesActivity = !activityFilter || (() => {
      if (!sensor.lastSeen) return activityFilter === "never"
      
      const lastSeenDate = new Date(sensor.lastSeen)
      const now = new Date()
      const diffHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60)
      
      switch (activityFilter) {
        case "last-hour":
          return diffHours <= 1
        case "last-day":
          return diffHours <= 24
        case "last-week":
          return diffHours <= 168 // 24 * 7
        case "old":
          return diffHours > 168
        case "never":
          return false
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesStatus && matchesFrequency && matchesActivity
  })

  const sortSensors = (sensors: Sensor[], sortBy: SortOption): Sensor[] => {
    switch (sortBy) {
      case 'newest':
        return [...sensors].sort((a, b) => {
          const aDate = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
          const bDate = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
          return bDate - aDate
        })
      case 'oldest':
        return [...sensors].sort((a, b) => {
          const aDate = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
          const bDate = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
          return aDate - bDate
        })
      case 'name-asc':
        return [...sensors].sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return [...sensors].sort((a, b) => b.name.localeCompare(a.name))
      case 'frequency-asc':
        return [...sensors].sort((a, b) => a.frequency - b.frequency)
      case 'frequency-desc':
        return [...sensors].sort((a, b) => b.frequency - a.frequency)
      default:
        return sensors
    }
  }

  const sortedSensors = sortSensors(filteredSensors, sortBy)

  const getStatusCounts = () => {
    const counts = { GREEN: 0, ORANGE: 0, RED: 0 }
    sensors.forEach((sensor) => {
      counts[sensor.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter(null)
    setFrequencyFilter(null)
    setActivityFilter(null)
  }

  // Afficher l'écran de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Retourner null si l'utilisateur n'est pas authentifié (la redirection se fait dans useEffect)
  if (!user || !user.emailVerified || !userProfile?.isApproved) {
    return null
  }

  // Préparer les options de centrage pour la carte
  const mapCenterOptions: { center: [number, number]; zoom: number } | undefined = 
    urlCenter && urlZoom ? {
      center: urlCenter.split(',').map(Number) as [number, number],
      zoom: parseInt(urlZoom)
    } : undefined

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-semibold text-muted-foreground">Chargement des capteurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Colonne de description - prend toute la hauteur */}
      <ProjectDescription />
      
      {/* Content principal - ajusté pour la colonne fixe */}
      <div className="lg:mr-[400px]">
        {/* Header */}
        <div className="glass-effect border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              <div className="space-y-3 sm:space-y-4 flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div 
                    className="lg:cursor-default cursor-pointer select-none lg:select-auto"
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        // Déclencher l'ouverture du modal sur mobile/tablette
                        const aboutButton = document.querySelector('[data-about-trigger]') as HTMLButtonElement;
                        if (aboutButton) aboutButton.click();
                      }
                    }}
                  >
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      AirWatch Bénin
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      <span className="hidden sm:inline">Surveillance de la qualité de l'air en temps réel</span>
                      <span className="sm:hidden">Qualité de l'air en temps réel</span>
                      <span className="lg:hidden text-xs ml-2 opacity-60">(toucher pour plus d'infos)</span>
                    </p>
                  </div>
                </div>

                <StatusIndicators 
                  statusCounts={statusCounts} 
                  onStatusFilter={setStatusFilter}
                  activeFilter={statusFilter}
                />
              </div>

              <div className="flex flex-row gap-3 flex-wrap">
                <ThemeToggle />
                <Button 
                  onClick={() => setIsAddSensorModalOpen(true)}
                  className="gradient-primary text-white hover:scale-105 hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2 hidden sm:block" />
                  Ajouter un Capteur
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="border-2 hover:bg-accent/50 transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2 hidden sm:block" />
                  Télécharger
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
              <div className="flex flex-1 gap-2 sm:gap-3 max-w-4xl min-w-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-effect border-2 focus:border-primary/50 transition-all duration-300 text-sm sm:text-base"
                  />
                </div>

                <AdvancedFilters 
                  frequencyFilter={frequencyFilter}
                  activityFilter={activityFilter}
                  onFrequencyFilterChange={setFrequencyFilter}
                  onActivityFilterChange={setActivityFilter}
                  disabled={viewMode === "map"}
                />
                
                <SortOptions 
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  disabled={viewMode === "map"}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  className="transition-all duration-300 flex-1 sm:flex-none"
                >
                  <Grid3X3 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Vue Grille</span>
                  <span className="sm:hidden">Grille</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  onClick={() => setViewMode("map")}
                  size="sm"
                  className="transition-all duration-300 flex-1 sm:flex-none"
                >
                  <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Vue Carte</span>
                  <span className="sm:hidden">Carte</span>
                </Button>
              </div>
            </div>

            {/* Filtres actifs */}
            <div className="mt-4">
              <ActiveFilters 
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                frequencyFilter={frequencyFilter}
                activityFilter={activityFilter}
                onClearSearch={() => setSearchTerm("")}
                onClearStatusFilter={() => setStatusFilter(null)}
                onClearFrequencyFilter={() => setFrequencyFilter(null)}
                onClearActivityFilter={() => setActivityFilter(null)}
                onClearAllFilters={clearAllFilters}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {viewMode === "map" ? (
            <div className="animate-fade-in">
              <MapView sensors={sortedSensors} centerOptions={mapCenterOptions} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
              {sortedSensors.map((sensor, index) => (
                <SensorCard
                  key={sensor.id}
                  sensor={sensor}
                  index={index}
                  isPopup={false}
                  showActions={true}
                />
              ))}
            </div>
          )}

          {sortedSensors.length === 0 && !loading && (
            <div className="text-center py-12 sm:py-20 animate-fade-in">
              <div className="max-w-md mx-auto px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-float">
                  <Search className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  {searchTerm || statusFilter || frequencyFilter || activityFilter ? "Aucun capteur trouvé" : "Aucun capteur enregistré"}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                  {searchTerm || statusFilter || frequencyFilter || activityFilter
                    ? "Essayez de modifier votre recherche ou d'effacer les filtres."
                    : "Commencez par ajouter votre premier capteur pour surveiller la qualité de l'air."}
                </p>
                {!(searchTerm || statusFilter || frequencyFilter || activityFilter) && (
                  <Button 
                    onClick={() => setIsAddSensorModalOpen(true)}
                    className="gradient-primary text-white hover:scale-105 hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Ajouter le premier capteur</span>
                    <span className="sm:inline">Ajouter un capteur</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DataDownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} sensors={sensors} />
      <AddSensorModal 
        isOpen={isAddSensorModalOpen} 
        onClose={() => setIsAddSensorModalOpen(false)} 
        onSensorAdded={fetchSensors}
      />
      
      {/* Composant d'installation PWA */}
      <PWAInstall />

      {/* Notification des mises à jour webhook */}
      <WebhookNotification lastWebhookUpdate={lastWebhookUpdate} />
    </div>
  )
} 