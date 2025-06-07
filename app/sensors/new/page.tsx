"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewSensorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    frequency: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSensorId, setNewSensorId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sensors", {
        method: "POST",
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

      if (response.ok) {
        const sensor = await response.json()
        setNewSensorId(sensor.id)
        setIsChecking(true)
        startConnectionCheck(sensor.id)
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
        const response = await fetch(`/api/sensors/${sensorId}`)
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

  if (newSensorId) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#28A745] flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Capteur créé avec succès !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Informations pour le développeur firmware :</strong>
                  <br />
                  <br />
                  <strong>ID du capteur :</strong> {newSensorId}
                  <br />
                  <strong>Nom :</strong> {formData.name}
                  <br />
                  <strong>Coordonnées :</strong> {formData.latitude}, {formData.longitude}
                  <br />
                  <strong>Fréquence d'envoi :</strong> {formData.frequency} minutes
                </AlertDescription>
              </Alert>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Test de Déploiement</h3>

                {isChecking && !isConnected && (
                  <div className="flex items-center gap-2 text-[#FFC107]">
                    <Clock className="w-5 h-5 animate-spin" />
                    En attente de la première connexion du capteur...
                  </div>
                )}

                {isConnected && (
                  <div className="flex items-center gap-2 text-[#28A745]">
                    <CheckCircle className="w-5 h-5" />✅ Connexion réussie ! Le capteur est en ligne.
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Link href={`/sensors/${newSensorId}`}>
                  <Button className="bg-[#007BFF] hover:bg-[#0056b3]">Voir le capteur</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewSensorId(null)
                    setIsConnected(false)
                    setIsChecking(false)
                    setFormData({ name: "", latitude: "", longitude: "", frequency: "" })
                  }}
                >
                  Ajouter un autre capteur
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#212529]">Ajouter un nouveau capteur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du capteur *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Capteur Cotonou - Place de l'Étoile Rouge"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="ex: 6.3703"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="ex: 2.3912"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence d'envoi (minutes) *</Label>
                <Input
                  id="frequency"
                  name="frequency"
                  type="number"
                  min="1"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  placeholder="ex: 15"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[#007BFF] hover:bg-[#0056b3]" disabled={isSubmitting}>
                {isSubmitting ? "Création en cours..." : "Créer le capteur"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
