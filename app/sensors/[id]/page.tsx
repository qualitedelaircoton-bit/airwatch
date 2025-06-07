"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CalendarIcon, BarChart3, TableIcon, Filter } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  frequency: number
  lastSeen: string | null
  status: "GREEN" | "ORANGE" | "RED"
}

interface SensorData {
  id: string
  timestamp: string
  pm1_0: number
  pm2_5: number
  pm10: number
  o3_raw: number
  o3_corrige: number
  no2_voltage_mv: number
  no2_ppb: number
  voc_voltage_mv: number
  co_voltage_mv: number
  co_ppb: number
}

const METRICS = [
  { key: "pm1_0", label: "PM1.0 (µg/m³)", color: "#8884d8", unit: "µg/m³" },
  { key: "pm2_5", label: "PM2.5 (µg/m³)", color: "#82ca9d", unit: "µg/m³" },
  { key: "pm10", label: "PM10 (µg/m³)", color: "#ffc658", unit: "µg/m³" },
  { key: "o3_raw", label: "O3 Brut (ppb)", color: "#ff7300", unit: "ppb" },
  { key: "o3_corrige", label: "O3 Corrigé (ppb)", color: "#00ff00", unit: "ppb" },
  { key: "no2_ppb", label: "NO2 (ppb)", color: "#ff0000", unit: "ppb" },
  { key: "co_ppb", label: "CO (ppb)", color: "#8b5cf6", unit: "ppb" },
  { key: "voc_voltage_mv", label: "VOC (mV)", color: "#f59e0b", unit: "mV" },
]

export default function SensorDetailPage({ params }: { params: { id: string } }) {
  const [sensor, setSensor] = useState<Sensor | null>(null)
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [filteredData, setFilteredData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    to: new Date(),
  })
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["pm2_5", "pm10", "o3_corrige"])

  useEffect(() => {
    fetchSensor()
  }, [params.id])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchSensorData()
    }
  }, [dateRange, params.id])

  useEffect(() => {
    // Filter data based on date range
    if (sensorData.length > 0 && dateRange.from && dateRange.to) {
      const filtered = sensorData.filter((data) => {
        const dataDate = new Date(data.timestamp)
        return dataDate >= dateRange.from! && dataDate <= dateRange.to!
      })
      setFilteredData(filtered)
    } else {
      setFilteredData(sensorData)
    }
  }, [sensorData, dateRange])

  const fetchSensor = async () => {
    try {
      const response = await fetch(`/api/sensors/${params.id}`)
      const data = await response.json()
      setSensor(data)
    } catch (error) {
      console.error("Error fetching sensor:", error)
    }
  }

  const fetchSensorData = async () => {
    if (!dateRange.from || !dateRange.to) return

    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/sensors/${params.id}/data?${searchParams}`)
      const data = await response.json()
      setSensorData(data)
    } catch (error) {
      console.error("Error fetching sensor data:", error)
    } finally {
      setLoading(false)
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

  const handleMetricToggle = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey) ? prev.filter((m) => m !== metricKey) : [...prev, metricKey],
    )
  }

  const setDatePreset = (hours: number) => {
    const now = new Date()
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000)
    setDateRange({ from, to: now })
  }

  if (!sensor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{sensor.name}</h1>
                <Badge
                  variant="secondary"
                  className="text-sm font-medium"
                  style={{
                    backgroundColor: `${getStatusColor(sensor.status)}15`,
                    color: getStatusColor(sensor.status),
                    border: `1px solid ${getStatusColor(sensor.status)}30`,
                  }}
                >
                  {getStatusText(sensor.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 block">Dernière émission</span>
                  <span className="font-medium text-gray-900">{formatLastSeen(sensor.lastSeen)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 block">Coordonnées</span>
                  <span className="font-medium text-gray-900">
                    {sensor.latitude}, {sensor.longitude}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 block">Fréquence</span>
                  <span className="font-medium text-gray-900">{sensor.frequency} minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtres de données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Période de données</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setDatePreset(1)}>
                  Dernière heure
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset(24)}>
                  Dernières 24h
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset(168)}>
                  7 derniers jours
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDatePreset(720)}>
                  30 derniers jours
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "dd/MM/yyyy HH:mm", { locale: fr }) : "Date de début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "dd/MM/yyyy HH:mm", { locale: fr }) : "Date de fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Métriques à afficher</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {METRICS.map((metric) => (
                  <div key={metric.key} className="flex items-center space-x-2 p-2 rounded border bg-white">
                    <Checkbox
                      id={metric.key}
                      checked={selectedMetrics.includes(metric.key)}
                      onCheckedChange={() => handleMetricToggle(metric.key)}
                    />
                    <Label htmlFor={metric.key} className="text-sm cursor-pointer flex-1">
                      {metric.label}
                    </Label>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                  </div>
                ))}
              </div>
            </div>

            {filteredData.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{filteredData.length}</strong> mesures trouvées pour la période sélectionnée
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Visualization */}
        <Tabs defaultValue="graph" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Graphique
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              Tableau
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-6">
            <Card className="shadow-sm">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => format(new Date(value), "dd/MM HH:mm")}
                        stroke="#666"
                      />
                      <YAxis stroke="#666" />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value), "dd/MM/yyyy HH:mm")}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
                  <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <BarChart3 className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-center">Aucune mesure trouvée pour la période sélectionnée.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <Card className="shadow-sm">
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
                          <TableHead className="font-semibold">Timestamp</TableHead>
                          <TableHead className="font-semibold">PM1.0 (µg/m³)</TableHead>
                          <TableHead className="font-semibold">PM2.5 (µg/m³)</TableHead>
                          <TableHead className="font-semibold">PM10 (µg/m³)</TableHead>
                          <TableHead className="font-semibold">O3 Corrigé (ppb)</TableHead>
                          <TableHead className="font-semibold">NO2 (ppb)</TableHead>
                          <TableHead className="font-semibold">CO (ppb)</TableHead>
                          <TableHead className="font-semibold">VOC (mV)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.slice(0, 100).map((data) => (
                          <TableRow key={data.id} className="hover:bg-gray-50">
                            <TableCell className="font-mono text-sm">
                              {format(new Date(data.timestamp), "dd/MM/yyyy HH:mm:ss")}
                            </TableCell>
                            <TableCell>{data.pm1_0.toFixed(2)}</TableCell>
                            <TableCell>{data.pm2_5.toFixed(2)}</TableCell>
                            <TableCell>{data.pm10.toFixed(2)}</TableCell>
                            <TableCell>{data.o3_corrige.toFixed(2)}</TableCell>
                            <TableCell>{data.no2_ppb.toFixed(2)}</TableCell>
                            <TableCell>{data.co_ppb.toFixed(2)}</TableCell>
                            <TableCell>{data.voc_voltage_mv.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredData.length > 100 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                          Affichage des 100 premiers résultats sur <strong>{filteredData.length}</strong> au total
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <TableIcon className="w-16 h-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
                    <p className="text-center">Aucune mesure trouvée pour la période sélectionnée.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
