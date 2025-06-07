"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Download, CheckCircle2, Circle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Sensor {
  id: string
  name: string
  status: "GREEN" | "ORANGE" | "RED"
}

interface DataDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  sensors: Sensor[]
}

export function DataDownloadModal({ isOpen, onClose, sensors }: DataDownloadModalProps) {
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [fileFormat, setFileFormat] = useState<"csv" | "json">("csv")
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!dateRange.from || !dateRange.to || selectedSensors.length === 0) {
      return
    }

    setIsDownloading(true)

    try {
      const params = new URLSearchParams({
        sensors: selectedSensors.join(","),
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        format: fileFormat,
      })

      const response = await fetch(`/api/sensors/data?${params}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sensor-data-${fileFormat === "csv" ? "export.csv" : "export.json"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        onClose()
      }
    } catch (error) {
      console.error("Error downloading data:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const resetForm = () => {
    setSelectedSensors([])
    setDateRange({ from: undefined, to: undefined })
    setFileFormat("csv")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((prev) => (prev.includes(sensorId) ? prev.filter((id) => id !== sensorId) : [...prev, sensorId]))
  }

  const selectAllSensors = () => {
    setSelectedSensors(sensors.map((s) => s.id))
  }

  const deselectAllSensors = () => {
    setSelectedSensors([])
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Télécharger les données des capteurs</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Sélection des capteurs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Sélectionner les capteurs</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSensors}
                    disabled={selectedSensors.length === sensors.length}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllSensors}
                    disabled={selectedSensors.length === 0}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="text-sm text-gray-600 mb-3">
                  {selectedSensors.length} capteur(s) sélectionné(s) sur {sensors.length}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-white cursor-pointer"
                      onClick={() => toggleSensor(sensor.id)}
                    >
                      <div className="flex items-center">
                        {selectedSensors.includes(sensor.id) ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(sensor.status) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{sensor.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sélection de la période */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Période</Label>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : "Date de début"}
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
                      {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : "Date de fin"}
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

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                    setDateRange({ from: yesterday, to: now })
                  }}
                >
                  Dernières 24h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setDateRange({ from: weekAgo, to: now })
                  }}
                >
                  7 derniers jours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setDateRange({ from: monthAgo, to: now })
                  }}
                >
                  30 derniers jours
                </Button>
              </div>
            </div>

            {/* Format de fichier */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Format de fichier</Label>
              <RadioGroup value={fileFormat} onValueChange={(value: "csv" | "json") => setFileFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV (Excel)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json">JSON</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!dateRange.from || !dateRange.to || selectedSensors.length === 0 || isDownloading}
            className="bg-[#007BFF] hover:bg-[#0056b3]"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Téléchargement..." : `Télécharger (${selectedSensors.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
