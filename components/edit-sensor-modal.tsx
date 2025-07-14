"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, X, Pencil } from "lucide-react"
import { type Sensor } from "./sensor-card" // Réutilisation du type Sensor

interface EditSensorModalProps {
  isOpen: boolean
  onClose: () => void
  onSensorUpdated?: () => void
  sensorToEdit: Sensor | null
}

interface FormData {
  name: string
  latitude: string
  longitude: string
  frequency: string
}

export default function EditSensorModal({ isOpen, onClose, onSensorUpdated, sensorToEdit }: EditSensorModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    latitude: "",
    longitude: "",
    frequency: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (sensorToEdit) {
      setFormData({
        name: sensorToEdit.name,
        latitude: String(sensorToEdit.latitude),
        longitude: String(sensorToEdit.longitude),
        frequency: String(sensorToEdit.frequency),
      })
    }
  }, [sensorToEdit])

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sensorToEdit) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/sensors/${sensorToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          latitude: Number.parseFloat(formData.latitude),
          longitude: Number.parseFloat(formData.longitude),
          frequency: Number.parseInt(formData.frequency),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la mise à jour du capteur")
      }
      
      setSuccess(true)
      onSensorUpdated?.()
      
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!isOpen || !sensorToEdit) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 glass-effect border-2 border-border/30 rounded-2xl shadow-2xl animate-slide-in overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Modifier le capteur</h2>
              <p className="text-sm text-muted-foreground">Mettez à jour les informations du capteur.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {success ? (
             <div className="text-center p-8 flex flex-col items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Mise à jour réussie !</h3>
              <p className="text-muted-foreground">Les informations du capteur ont été mises à jour.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Nom du capteur *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Capteur Cotonou - Place de l'Étoile Rouge"
                  required
                  className="glass-effect border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-foreground font-medium">Latitude *</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="ex: 6.3703"
                    required
                    className="glass-effect border-2 focus:border-primary/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-foreground font-medium">Longitude *</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="ex: 2.3912"
                    required
                    className="glass-effect border-2 focus:border-primary/50 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-foreground font-medium">Fréquence d'envoi (minutes) *</Label>
                <Input
                  id="frequency"
                  name="frequency"
                  type="number"
                  min="1"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  placeholder="ex: 15"
                  required
                  className="glass-effect border-2 focus:border-primary/50 transition-all duration-300"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 gradient-primary text-white hover:scale-105 hover:shadow-xl transition-all duration-300" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mise à jour..." : "Enregistrer les modifications"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-2 hover:bg-accent/50 transition-all duration-300"
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
