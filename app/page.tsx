"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false)

  // Gérer les paramètres URL pour centrer la carte
  const urlView = searchParams.get('view')
  const urlCenter = searchParams.get('center')
  const urlZoom = searchParams.get('zoom')

  const fetchSensors = async () => {
    try {
      const response = await fetch("/api/sensors")
      const data = await response.json()
      setSensors(data)
    } catch (error) {
      console.error("Error fetching sensors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSensors()
  }, [])

  // Définir le mode de vue basé sur l'URL
  useEffect(() => {
    if (urlView === 'map') {
      setViewMode('map')
    }
  }, [urlView])

  const filteredSensors = sensors.filter((sensor) =>
    sensor.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusCounts = () => {
    const counts = { GREEN: 0, ORANGE: 0, RED: 0 }
    sensors.forEach((sensor) => {
      counts[sensor.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

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
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      AirWatch Bénin
                    </h1>
                    <p className="text-muted-foreground">
                      Surveillance de la qualité de l'air en temps réel
                      <span className="lg:hidden text-xs ml-2 opacity-60">(toucher pour plus d'infos)</span>
                    </p>
                  </div>
                </div>

                <StatusIndicators statusCounts={statusCounts} />
              </div>

              <div className="flex flex-row gap-3 lg:items-center">
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-8 pt-6 border-t border-border/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom de capteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-effect border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  className="transition-all duration-300"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Vue Grille
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  onClick={() => setViewMode("map")}
                  size="sm"
                  className="transition-all duration-300"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Vue Carte
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {viewMode === "map" ? (
            <div className="animate-fade-in">
              <MapView sensors={filteredSensors} centerOptions={mapCenterOptions} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredSensors.map((sensor, index) => (
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

          {filteredSensors.length === 0 && !loading && (
            <div className="text-center py-20 animate-fade-in">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {searchTerm ? "Aucun capteur trouvé" : "Aucun capteur enregistré"}
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {searchTerm
                    ? "Essayez de modifier votre recherche ou d'effacer les filtres."
                    : "Commencez par ajouter votre premier capteur pour surveiller la qualité de l'air."}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsAddSensorModalOpen(true)}
                    className="gradient-primary text-white hover:scale-105 hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter le premier capteur
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
    </div>
  )
}
