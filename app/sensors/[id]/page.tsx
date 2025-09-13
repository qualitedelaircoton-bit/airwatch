"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { ArrowLeft, CalendarIcon, BarChart3, TableIcon, Filter, Download, Clock, Settings } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { use } from "react"
import { DataDownloadModal } from "@/components/data-download-modal"
import { formatFirestoreTimestamp } from "@/lib/date-utils"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc as fsDoc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  frequency: number
  lastSeen: string | null | { seconds: number; nanoseconds: number }
  status: "GREEN" | "ORANGE" | "RED"
}

interface SensorData {
  id: string; // Ajout de l'ID pour la key de la table
  timestamp: number; // Millisecondes
  pm1_0: number;
  pm2_5: number;
  pm10: number;
  o3_raw: number;
  o3_corrige: number;
  no2_voltage_v: number;
  no2_ppb: number;
  voc_voltage_v: number;
  co_voltage_v: number;
  co_ppb: number;
}

const METRICS = [
  { key: "pm1_0", label: "PM1 (µg/m³)", color: "#8884d8", unit: "µg/m³" },
  { key: "pm2_5", label: "PM25 (µg/m³)", color: "#82ca9d", unit: "µg/m³" },
  { key: "pm10", label: "PM10 (µg/m³)", color: "#ffc658", unit: "µg/m³" },
  { key: "o3_raw", label: "O3 (ppb)", color: "#ff7300", unit: "ppb" },
  { key: "o3_corrige", label: "O3c (ppb)", color: "#eab308", unit: "ppb" },
  { key: "no2_ppb", label: "NO2 (ppb)", color: "#8b5cf6", unit: "ppb" },
  { key: "co_ppb", label: "CO (ppm)", color: "#ef4444", unit: "ppm" },
  { key: "no2_voltage_v", label: "NO2v (Vs)", color: "#a855f7", unit: "Vs" },
  { key: "voc_voltage_v", label: "VOCv (Vs)", color: "#f59e0b", unit: "Vs" },
  { key: "co_voltage_v", label: "COv (Vs)", color: "#f43f5e", unit: "Vs" },
]

export default function SensorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { authStatus, loading: authLoading } = useAuth()
  const [sensor, setSensor] = useState<Sensor | null>(null)
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [filteredData, setFilteredData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h pour accélérer le premier rendu
    to: new Date(),
  })
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["pm2_5", "pm10", "o3_corrige"])
  const [activePreset, setActivePreset] = useState<string>("7days")
  const [displayedRows, setDisplayedRows] = useState<number>(50)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  // Protection de la page par état d'authentification (cohérent avec Dashboard)
  useEffect(() => {
    if (!authLoading) {
      switch (authStatus) {
        case 'unauthenticated':
          router.push('/auth/login')
          break
        case 'pending_verification':
          router.push('/auth/verify-email')
          break
        case 'pending_approval':
          router.push('/auth/pending-approval')
          break
        default:
          break
      }
    }
  }, [authStatus, authLoading, router])

  useEffect(() => {
    if (authStatus === 'authenticated' || authStatus === 'admin') {
      fetchSensor()
      // Rafraîchissement automatique toutes les 60 secondes
      const interval = setInterval(() => {
        fetchSensor()
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [id, authStatus])

  useEffect(() => {
    if ((authStatus === 'authenticated' || authStatus === 'admin') && dateRange.from && dateRange.to) {
      fetchSensorData()
      // Rafraîchissement automatique des données toutes les 30 secondes
      const interval = setInterval(() => {
        if (dateRange.from && dateRange.to) {
          fetchSensorData(false)
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [dateRange, id, authStatus])

  // Abonnement temps réel: document capteur (statut/lastSeen)
  useEffect(() => {
    if (!(authStatus === 'authenticated' || authStatus === 'admin')) return
    if (!id) return
    const ref = fsDoc(db, 'sensors', id)
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any
      if (!data) return
      setSensor((prev) => prev ? ({
        ...prev,
        name: data.name ?? prev.name,
        latitude: typeof data.latitude === 'number' ? data.latitude : prev.latitude,
        longitude: typeof data.longitude === 'number' ? data.longitude : prev.longitude,
        frequency: typeof data.frequency === 'number' ? data.frequency : prev.frequency,
        lastSeen: data.lastSeen ?? prev.lastSeen,
        status: data.status ?? prev.status,
      }) : prev)
    })
    return () => unsub()
  }, [authStatus, id])

  // Abonnement temps réel: dernier point de données
  useEffect(() => {
    if (!(authStatus === 'authenticated' || authStatus === 'admin')) return
    if (!id) return
    const dataQ = query(
      collection(db, 'sensors', id, 'data'),
      orderBy('timestamp', 'desc'),
      limit(1)
    )
    const unsub = onSnapshot(dataQ, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const d = change.doc.data() as any
          const ts = d?.timestamp
          let millis: number | null = null
          if (ts?.toDate) {
            millis = ts.toDate().getTime()
          } else if (typeof ts?.seconds === 'number') {
            millis = ts.seconds * 1000
          } else if (typeof ts === 'string') {
            const date = new Date(ts)
            if (!isNaN(date.getTime())) millis = date.getTime()
          }
          if (millis == null) return
          // Ne conserver que si dans l'intervalle affiché
          if (dateRange.from && dateRange.to && (millis < dateRange.from.getTime() || millis > dateRange.to.getTime())) {
            return
          }
          const newItem: SensorData = {
            id: `${change.doc.id}-${Math.floor(millis/1000)}`,
            timestamp: millis,
            pm1_0: Number(d.pm1_0 ?? d.PM1 ?? 0),
            pm2_5: Number(d.pm2_5 ?? d.PM25 ?? 0),
            pm10: Number(d.pm10 ?? d.PM10 ?? 0),
            o3_raw: Number(d.o3_raw ?? d.O3 ?? 0),
            o3_corrige: Number(d.o3_corrige ?? d.O3c ?? 0),
            no2_voltage_v: Number(d.no2_voltage_v ?? d.NO2v ?? 0),
            no2_ppb: Number(d.no2_ppb ?? d.NO2 ?? 0),
            voc_voltage_v: Number(d.voc_voltage_v ?? d.VOCv ?? 0),
            co_voltage_v: Number(d.co_voltage_v ?? d.COv ?? 0),
            co_ppb: Number(d.co_ppb ?? d.CO ?? 0),
          }
          setSensorData((prev) => {
            // éviter les doublons
            const exists = prev.some(p => p.id === newItem.id)
            const next = exists ? prev.map(p => p.id === newItem.id ? newItem : p) : [newItem, ...prev]
            // maintenir tri décroissant par timestamp
            return next.sort((a, b) => b.timestamp - a.timestamp)
          })
        }
      })
    })
    return () => unsub()
  }, [authStatus, id, dateRange.from, dateRange.to])

  useEffect(() => {
    // Filter data based on date range and sort by timestamp descending (most recent first)
    if (sensorData.length > 0 && dateRange.from && dateRange.to) {
      const filtered = sensorData.filter((data) => {
        const dataDate = new Date(data.timestamp)
        return dataDate >= dateRange.from! && dataDate <= dateRange.to!
      });
      // Sort by timestamp descending (most recent first)
      const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp);
      setFilteredData(sorted)
    } else {
      // Sort by timestamp descending (most recent first)
      const sorted = [...sensorData].sort((a, b) => b.timestamp - a.timestamp);
      setFilteredData(sorted)
    }
    // Reset displayed rows when data changes
    setDisplayedRows(50)
  }, [sensorData, dateRange])

  const fetchSensor = async () => {
    try {
      const auth = (await import('@/lib/firebase')).auth;
      let idToken = auth?.currentUser ? await auth.currentUser.getIdToken(true) : null;

      let response = await fetch(`/api/sensors/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });

      // Retry une fois si 401 (token expiré)
      if (response.status === 401 && auth?.currentUser) {
        idToken = await auth.currentUser.getIdToken(true)
        response = await fetch(`/api/sensors/${id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            Authorization: `Bearer ${idToken}`,
          },
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Le capteur n'a pas été trouvé ou une erreur s'est produite" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setSensor(data);
    } catch (error) {
      console.error("Error fetching sensor details:", error);
      // Optionnel: Mettre en place un état d'erreur pour informer l'utilisateur
      setSensor(null); // Garder le chargement ou afficher une erreur
    }
  };

  const fetchSensorData = async (showLoading = true) => {
    if (!dateRange.from || !dateRange.to) return

    if (showLoading) setLoading(true)
    try {
      // Get Firebase auth token
      const auth = (await import('@/lib/firebase')).auth
      let idToken = auth?.currentUser ? await auth.currentUser.getIdToken(true) : null
      
      const searchParams = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      let response = await fetch(`/api/sensors/${id}/data?${searchParams}`, {
        headers: {
          'Cache-Control': 'no-cache',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        }
      })
      if (response.status === 401 && auth?.currentUser) {
        // Retry une fois avec refresh forcé
        idToken = await auth.currentUser.getIdToken(true)
        response = await fetch(`/api/sensors/${id}/data?${searchParams}`, {
          headers: {
            'Cache-Control': 'no-cache',
            Authorization: `Bearer ${idToken}`
          }
        })
      }
      if (!response.ok) {
        console.warn('Fetch sensor data failed with status:', response.status)
      }
      const rawData = await response.json()
      const processedData = rawData.map((d: any) => ({
        ...d,
        id: `${d.id}-${d.timestamp.seconds}`,
        timestamp: d.timestamp.seconds * 1000,
      }))
      setSensorData(processedData)
    } catch (error) {
      console.error("Error fetching sensor data:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GREEN":
        return "#28A745"
      case "ORANGE":
        return "#FFC107"
      case "RED":
        return "#DC3545"
      default:
        return "#6C757D"
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


  const handleMetricToggle = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((m) => m !== metricKey) : [...prev, metricKey],
    )
  }

  const selectAllMetrics = () => {
    setSelectedMetrics(METRICS.map(metric => metric.key))
  }

  const deselectAllMetrics = () => {
    setSelectedMetrics([])
  }

  const setDatePreset = (hours: number, presetId: string) => {
    const now = new Date()
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000)
    setDateRange({ from, to: now })
    setActivePreset(presetId)
  }

  if (!sensor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="glass-effect border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="glass-effect border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {/* Informations compactes sur une ligne - Desktop */}
              <div className="hidden md:flex flex-wrap items-center gap-4 text-sm bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{sensor.name}</h1>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(sensor.status)}15`,
                      color: getStatusColor(sensor.status),
                      border: `1px solid ${getStatusColor(sensor.status)}30`,
                    }}
                  >
                    {getStatusText(sensor.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Dernière émission</span>
                  <span className="font-medium text-foreground">{formatFirestoreTimestamp(sensor.lastSeen)}</span>
                </div>
                
                <div 
                  className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors group"
                  onClick={() => window.open(`/?view=map&center=${sensor.latitude},${sensor.longitude}&zoom=15`, '_blank')}
                >
                  <span className="text-muted-foreground group-hover:text-primary">📍 Coordonnées (cliquer pour voir sur la carte)</span>
                  <span className="font-medium text-foreground group-hover:text-primary">
                    {sensor.latitude}, {sensor.longitude}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Fréquence</span>
                  <span className="font-medium text-foreground">{sensor.frequency} minutes</span>
                </div>
              </div>

              {/* Informations compactes - Mobile */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-lg font-bold text-foreground truncate">{sensor.name}</h1>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium shrink-0"
                    style={{
                      backgroundColor: `${getStatusColor(sensor.status)}15`,
                      color: getStatusColor(sensor.status),
                      border: `1px solid ${getStatusColor(sensor.status)}30`,
                    }}
                  >
                    {getStatusText(sensor.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-muted-foreground">Dernière émission</div>
                  <div className="font-medium text-foreground">{formatFirestoreTimestamp(sensor.lastSeen)}</div>
                  </div>
                  
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-muted-foreground">Fréquence</div>
                    <div className="font-medium text-foreground">{sensor.frequency} min</div>
                  </div>
                </div>
                
                <div 
                  className="bg-muted/30 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                  onClick={() => window.open(`/?view=map&center=${sensor.latitude},${sensor.longitude}&zoom=15`, '_blank')}
                >
                  <div className="text-muted-foreground">📍 Coordonnées</div>
                  <div className="font-medium text-foreground">
                    {sensor.latitude}, {sensor.longitude}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Data Visualization avec filtres compacts */}
        <Tabs defaultValue="table" className="w-full">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-6">
            <TabsList className="grid grid-cols-2 glass-effect hidden md:grid">
              <TabsTrigger value="graph" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4" />
                Graphique
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TableIcon className="w-4 h-4" />
                Tableau
              </TabsTrigger>
            </TabsList>
            
            {/* Titre mobile */}
            <div className="md:hidden">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TableIcon className="w-5 h-5" />
                Données du capteur
              </h2>
            </div>

            {/* Filtres compacts */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Période prédéfinie */}
              <Select value={activePreset} onValueChange={(value) => {
                if (value === "1hour") setDatePreset(1, "1hour")
                else if (value === "24hours") setDatePreset(24, "24hours")
                else if (value === "7days") setDatePreset(168, "7days")
                else if (value === "30days") setDatePreset(720, "30days")
              }}>
                <SelectTrigger className="w-[120px] md:w-[150px]">
                  <Clock className="w-4 h-4 mr-1 md:mr-2" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">Dernière heure</SelectItem>
                  <SelectItem value="24hours">Dernières 24h</SelectItem>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>

              {/* Sélection de métriques */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Métriques</span>
                    <span className="sm:hidden">Données</span>
                    <span className="ml-1">({selectedMetrics.length})</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="px-2 py-1 border-b border-border">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllMetrics}
                        className="h-7 px-2 text-xs flex-1"
                      >
                        Tout cocher
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deselectAllMetrics}
                        className="h-7 px-2 text-xs flex-1"
                      >
                        Tout décocher
                      </Button>
                    </div>
                  </div>
                  {METRICS.map((metric) => (
                    <DropdownMenuCheckboxItem
                      key={metric.key}
                      checked={selectedMetrics.includes(metric.key)}
                      onCheckedChange={() => handleMetricToggle(metric.key)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                        {metric.label}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dates personnalisées - Sélecteurs améliorés */}
              <div className="hidden md:flex gap-2 items-center">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setDateRange((prev) => ({ ...prev, from: date }))
                      setActivePreset("")
                    }}
                    className="w-[140px] h-9 text-xs border-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                    max={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
                  />
                </div>
                <span className="text-xs text-muted-foreground">→</span>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setDateRange((prev) => ({ ...prev, to: date }))
                      setActivePreset("")
                    }}
                    className="w-[140px] h-9 text-xs border-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                    min={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                  />
                </div>
              </div>

              {/* Dates personnalisées - Mobile */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Dates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-4">
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-foreground">Période personnalisée</div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Date de début</label>
                          <Input
                            type="date"
                            value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined
                              setDateRange((prev) => ({ ...prev, from: date }))
                              setActivePreset("")
                            }}
                            className="w-full text-xs border-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                            max={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Date de fin</label>
                          <Input
                            type="date"
                            value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined
                              setDateRange((prev) => ({ ...prev, to: date }))
                              setActivePreset("")
                            }}
                            className="w-full text-xs border-2 hover:border-primary/50 focus:border-primary transition-all duration-200"
                            min={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                          />
                        </div>

                        {/* Message de validation pour mobile */}
                        {dateRange.from && dateRange.to && dateRange.from > dateRange.to && (
                          <div className="text-xs text-red-500 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Date de fin invalide</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Résultat et téléchargement */}
              {filteredData.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
                    {filteredData.length} mesures
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="px-2"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="graph" className="mt-6">
            <Card className="glass-effect border-2">
              <CardHeader>
                <CardTitle>Évolution des données dans le temps</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
                  </div>
                ) : filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => format(new Date(value), "dd/MM HH:mm")}
                        stroke="var(--color-muted-foreground)"
                      />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value), "dd/MM/yyyy HH:mm")}
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          color: "var(--color-card-foreground)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          boxShadow: "var(--shadow-md)",
                        }}
                      />
                      <Legend />
                      {selectedMetrics.map((metricKey) => {
                        const metric = METRICS.find((m) => m.key === metricKey)
                        return metric ? (
                          <Line
                            key={metricKey}
                            type="monotone"
                            dataKey={metricKey}
                            stroke={metric.color}
                            strokeWidth={2}
                            name={metric.label}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        ) : null
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-center">Aucune mesure trouvée pour la période sélectionnée.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <Card className="glass-effect border-2">
              <CardHeader>
                <CardTitle>Données brutes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
                  </div>
                ) : filteredData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold min-w-[140px]">
                            <span className="hidden sm:inline">Timestamp</span>
                            <span className="sm:hidden">Date/Heure</span>
                          </TableHead>
                          {selectedMetrics.map((metricKey) => {
                            const metric = METRICS.find((m) => m.key === metricKey)
                            return metric ? (
                              <TableHead key={metricKey} className="font-semibold min-w-[80px]">
                                <span className="hidden sm:inline">{metric.label}</span>
                                <span className="sm:hidden">{metric.label.split(' ')[0]}</span>
                              </TableHead>
                            ) : null
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.slice(0, displayedRows).map((data) => (
                          <TableRow key={data.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs sm:text-sm">
                              <span className="hidden sm:inline">
                                {format(new Date(data.timestamp), "dd/MM/yyyy HH:mm:ss")}
                              </span>
                              <span className="sm:hidden">
                                {format(new Date(data.timestamp), "dd/MM HH:mm")}
                              </span>
                            </TableCell>
                            {selectedMetrics.map((metricKey) => {
                              const metric = METRICS.find((m) => m.key === metricKey)
                              return metric ? (
                                <TableCell key={metricKey} className="text-xs sm:text-sm">
                                  {(data[metricKey as keyof SensorData] as number).toFixed(2)}
                                </TableCell>
                              ) : null
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredData.length > displayedRows && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center border border-border/50">
                        <p className="text-sm text-muted-foreground mb-3">
                          Affichage des {displayedRows} premiers résultats sur <strong>{filteredData.length}</strong> au total
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setDisplayedRows(prev => Math.min(prev + 50, filteredData.length))}
                          className="transition-all duration-300"
                        >
                          Voir plus de données ({Math.min(50, filteredData.length - displayedRows)} suivantes)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <TableIcon className="w-16 h-16 mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-center">Aucune mesure trouvée pour la période sélectionnée.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de téléchargement avec options présélectionnées */}
      {sensor && (
        <DataDownloadModal 
          isOpen={isDownloadModalOpen} 
          onClose={() => setIsDownloadModalOpen(false)} 
          sensors={[sensor]}
          preselectedSensors={[sensor.id]}
          preselectedDateRange={dateRange}
        />
      )}
    </div>
  )
}
