"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Download, CheckCircle2, Circle, FileText, FileCode, Sparkles } from "lucide-react"
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
        return "var(--color-air-green)"
      case "ORANGE":
        return "var(--color-air-orange)"
      case "RED":
        return "var(--color-air-red)"
      default:
        return "var(--color-muted-foreground)"
    }
  }

  const getStatusHexColor = (status: string) => {
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

  const isFormValid = dateRange.from && dateRange.to && selectedSensors.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] glass-effect border-2 flex flex-col z-[9999]">
        <DialogHeader className="space-y-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            Télécharger les données des capteurs
          </DialogTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sélectionnez les capteurs et la période pour télécharger leurs données de qualité de l'air.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {/* Sélection des capteurs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Sélectionner les capteurs
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSensors}
                    disabled={selectedSensors.length === sensors.length}
                    className="text-xs hover:scale-105 transition-all duration-200"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllSensors}
                    disabled={selectedSensors.length === 0}
                    className="text-xs hover:scale-105 transition-all duration-200"
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border-2 border-border/50 overflow-hidden">
                <div className="glass-effect p-4 border-b border-border/50">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{selectedSensors.length}</span> capteur(s) sélectionné(s) sur{" "}
                    <span className="font-semibold">{sensors.length}</span>
                  </div>
                </div>

                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <ScrollArea className="h-40 scrollbar-thin">
                    <div className="p-2 space-y-1">
                      {sensors.map((sensor) => (
                        <div
                          key={sensor.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-all duration-200 group border border-transparent hover:border-border/30"
                          onClick={() => toggleSensor(sensor.id)}
                        >
                          <div className="flex items-center">
                            {selectedSensors.includes(sensor.id) ? (
                              <CheckCircle2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-3 h-3 rounded-full animate-pulse-glow"
                              style={{ 
                                backgroundColor: getStatusHexColor(sensor.status),
                                boxShadow: `0 0 8px color-mix(in srgb, ${getStatusHexColor(sensor.status)} 40%, transparent)`
                              }}
                            />
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                              {sensor.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* Sélection de la période */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Période de données
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start glass-effect border-2 hover:border-primary/50 transition-all duration-200"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : "Sélectionner..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-effect border-2" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start glass-effect border-2 hover:border-primary/50 transition-all duration-200"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : "Sélectionner..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-effect border-2" align="start">
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
            </div>

            {/* Format de fichier */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Format de fichier
              </Label>
              <RadioGroup 
                value={fileFormat} 
                onValueChange={(value) => setFileFormat(value as "csv" | "json")}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <Label 
                    htmlFor="csv" 
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 cursor-pointer transition-all duration-200 glass-effect"
                  >
                    <RadioGroupItem value="csv" id="csv" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">CSV</div>
                        <div className="text-xs text-muted-foreground">Compatible avec Excel</div>
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <Label 
                    htmlFor="json" 
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 cursor-pointer transition-all duration-200 glass-effect"
                  >
                    <RadioGroupItem value="json" id="json" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileCode className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">JSON</div>
                        <div className="text-xs text-muted-foreground">Format structuré</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/50 pt-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="sm:w-auto w-full hover:bg-accent/50 transition-all duration-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!isFormValid || isDownloading}
              className="sm:w-auto w-full gradient-primary text-white hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger {fileFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
          
          {!isFormValid && (
            <div className="text-xs text-muted-foreground mt-2 w-full">
              Veuillez sélectionner au moins un capteur et une période valide.
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
