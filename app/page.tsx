"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Grid3X3, Download, Plus, Search, Activity, Zap, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { MapView } from "@/components/map-view"
import { DataDownloadModal } from "@/components/data-download-modal"
import { ThemeToggle } from "@/components/theme-toggle"

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
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"map" | "grid">("grid")
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSensors()
  }, [])

  const fetchSensors = async () => {
    try {
      const response = await fetch("/api/sensors");
      if (!response.ok) {
        console.error(`Failed to fetch sensors: ${response.status} ${response.statusText}`);
        setSensors([]); // Default to empty array on HTTP error
        return; // setLoading(false) will be handled by finally
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setSensors(data);
      } else {
        console.warn("Fetched sensor data is not in expected array format. API response:", data);
        // Attempt to find data in common structures, e.g. if API returns { "data": [...] } or { "sensors": [...] }
        if (data && Array.isArray(data.data)) {
          setSensors(data.data);
        } else if (data && Array.isArray(data.sensors)) {
          setSensors(data.sensors);
        } else {
          setSensors([]); // Default to empty array if data format is unexpected or not found in nested properties
        }
      }
    } catch (error) {
      // This catch block handles errors from fetch itself (network error) or response.json() (invalid JSON)
      console.error("Error processing or fetching sensors:", error);
      setSensors([]); // Default to empty array on any other error
    } finally {
      setLoading(false);
    }
  }

  const filteredSensors = sensors.filter((sensor) => sensor.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GREEN":
        return "hsl(var(--air-green))"
      case "ORANGE":
        return "hsl(var(--air-orange))"
      case "RED":
        return "hsl(var(--air-red))"
      default:
        return "hsl(var(--muted-foreground))"
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

  const getStatusCounts = () => {
    const counts = { GREEN: 0, ORANGE: 0, RED: 0 }
    sensors.forEach((sensor) => {
      counts[sensor.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
        <div className="glass-effect border-b">
          <div className="max-w-7xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded-lg w-1/3 mb-6"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-muted rounded-lg w-32"></div>
                <div className="h-10 bg-muted rounded-lg w-32"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="glass-effect border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-air-quality-blue to-air-quality-purple flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    AirWatch Bénin
                  </h1>
                  <p className="text-muted-foreground">Surveillance de la qualité de l'air en temps réel</p>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-3 h-3 rounded-full bg-air-quality-green shadow-glow-green"></div>
                  <span className="font-medium">{statusCounts.GREEN} en ligne</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <div className="w-3 h-3 rounded-full bg-air-quality-orange shadow-glow-orange"></div>
                  <span className="font-medium">{statusCounts.ORANGE} en retard</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-500/10 border border-red-500/20">
                  <div className="w-3 h-3 rounded-full bg-air-quality-red shadow-glow-red"></div>
                  <span className="font-medium">{statusCounts.RED} hors ligne</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ThemeToggle />
              <Link href="/sensors/new">
                <Button className="bg-linear-to-r from-air-quality-blue to-air-quality-purple hover:shadow-glow transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un Capteur
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setIsDownloadModalOpen(true)}
                className="border-2 hover:bg-accent/50 transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
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
                className="pl-10 bg-card/50 backdrop-blur-sm border-2 focus:border-primary/50 transition-all duration-300"
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
            <MapView sensors={filteredSensors} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredSensors.map((sensor, index) => (
              <Link key={sensor.id} href={`/sensors/${sensor.id}`}>
                <Card
                  className="sensor-card h-full glass-effect border-2 hover:border-primary/30 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full shrink-0 mt-0.5 shadow-lg transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: getStatusColor(sensor.status),
                          boxShadow: `0 0 10px ${getStatusColor(sensor.status)}40`,
                        }}
                      />
                      <CardTitle className="text-base font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
                        {sensor.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Statut:</span>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium border-2 transition-all duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: `${getStatusColor(sensor.status)}15`,
                          color: getStatusColor(sensor.status),
                          borderColor: `${getStatusColor(sensor.status)}30`,
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(sensor.status)}
                          {getStatusText(sensor.status)}
                        </span>
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">Dernière émission:</span>
                        <div className="text-xs bg-muted/50 p-2 rounded-lg border">
                          {formatLastSeen(sensor.lastSeen)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Fréquence:</span>
                        <span className="font-semibold text-primary">{sensor.frequency} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {filteredSensors.length === 0 && !loading && (
          <div className="text-center py-20 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-linear-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 float-animation">
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
                <Link href="/sensors/new">
                  <Button className="bg-linear-to-r from-air-quality-blue to-air-quality-purple hover:shadow-glow transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter le premier capteur
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <DataDownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} sensors={sensors} />
    </div>
  )
}
