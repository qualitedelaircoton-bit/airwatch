"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, X, Plus } from "lucide-react"

interface AddSensorModalProps {
  isOpen: boolean
  onClose: () => void
  onSensorAdded?: () => void
}

interface FormData {
  name: string
  latitude: string
  longitude: string
  frequency: string
}

export default function AddSensorModal({ isOpen, onClose, onSensorAdded }: AddSensorModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    latitude: "",
    longitude: "",
    frequency: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSensorId, setNewSensorId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const resetForm = () => {
    setFormData({ name: "", latitude: "", longitude: "", frequency: "" })
    setNewSensorId(null)
    setIsConnected(false)
    setIsChecking(false)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const auth = (await import('@/lib/firebase')).auth
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null
      const response = await fetch("/api/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          name: formData.name,
          latitude: Number.parseFloat(formData.latitude),
          longitude: Number.parseFloat(formData.longitude),
          frequency: Number.parseInt(formData.frequency),
        }),
      })

      if (response.ok) {
        const sensor = await response.json()
        setNewSensorId(sensor.id)
        setIsChecking(true)
        startConnectionCheck(sensor.id)
        onSensorAdded?.()
      }
    } catch (error) {
      console.error("Error creating sensor:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startConnectionCheck = (sensorId: string) => {
    const checkConnection = async () => {
      try {
        const auth = (await import('@/lib/firebase')).auth
        const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null
        const response = await fetch(`/api/sensors/${sensorId}`, {
          headers: {
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
          }
        })
        const sensor = await response.json()

        if (sensor.lastSeen) {
          setIsConnected(true)
          setIsChecking(false)
          return
        }
      } catch (error) {
        console.error("Error checking sensor connection:", error)
      }

      // Continue checking every 5 seconds
      setTimeout(checkConnection, 5000)
    }

    checkConnection()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddAnother = () => {
    setNewSensorId(null)
    setIsConnected(false)
    setIsChecking(false)
    setFormData({ name: "", latitude: "", longitude: "", frequency: "" })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 glass-effect border-2 border-border/30 rounded-2xl shadow-2xl animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {newSensorId ? "Capteur créé avec succès !" : "Ajouter un nouveau capteur"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {newSensorId ? "Configuration et test de déploiement" : "Configurer un nouveau capteur de qualité d'air"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-destructive/10 hover:text-destructive rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {newSensorId ? (
            // Success View
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Capteur créé avec succès !</span>
              </div>

              <Alert className="border-primary/20 bg-primary/5">
                <AlertDescription className="space-y-2">
                  <div className="font-semibold text-primary">Informations pour le développeur firmware :</div>
                  <div className="space-y-1 text-sm">
                    <div><strong>ID du capteur :</strong> <code className="bg-muted px-2 py-1 rounded">{newSensorId}</code></div>
                    <div><strong>Nom :</strong> {formData.name}</div>
                    <div><strong>Coordonnées :</strong> {formData.latitude}, {formData.longitude}</div>
                    <div><strong>Fréquence d'envoi :</strong> {formData.frequency} minutes</div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="border-t border-border/20 pt-6">
                <h3 className="font-semibold mb-4 text-foreground">Test de Déploiement</h3>

                {isChecking && !isConnected && (
                  <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>En attente de la première connexion du capteur...</span>
                  </div>
                )}

                {isConnected && (
                  <div className="flex items-center gap-3 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800/30">
                    <CheckCircle className="w-5 h-5" />
                    <span>✅ Connexion réussie ! Le capteur est en ligne.</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="gradient-primary text-white hover:scale-105 transition-all duration-300"
                  onClick={() => window.open(`/sensors/${newSensorId}`, '_blank')}
                >
                  Voir le capteur
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddAnother}
                  className="border-2 hover:bg-accent/50 transition-all duration-300"
                >
                  Ajouter un autre capteur
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="hover:bg-muted/50"
                >
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            // Form View
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  {isSubmitting ? "Création en cours..." : "Créer le capteur"}
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