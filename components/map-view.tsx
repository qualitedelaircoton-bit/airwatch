"use client"

import { useEffect, useRef, useState } from "react"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  lastSeen: string | null
  status: "GREEN" | "ORANGE" | "RED"
}

interface MapViewProps {
  sensors: Sensor[]
}

declare global {
  interface Window {
    L: any
  }
}

export function MapView({ sensors }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isMapReady, setIsMapReady] = useState(false)

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

  const createCustomIcon = (status: string) => {
    if (!window.L) return null

    const color = getStatusColor(status)
    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" strokeWidth="3"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `

    return window.L.divIcon({
      html: svgIcon,
      className: "custom-sensor-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return

    // Coordonnées du Bénin : centre approximatif
    const beninCenter: [number, number] = [9.3077, 2.3158]

    // Initialiser la carte
    const map = window.L.map(mapRef.current, {
      center: beninCenter,
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true,
    })

    // Ajouter la couche OpenStreetMap
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 6,
    }).addTo(map)

    // Définir les limites du Bénin pour contraindre la vue
    const beninBounds = window.L.latLngBounds(
      [6.0, 0.5], // Sud-Ouest
      [12.5, 4.0], // Nord-Est
    )
    map.setMaxBounds(beninBounds)

    mapInstanceRef.current = map
    setIsMapReady(true)
  }

  const addMarkersToMap = () => {
    if (!mapInstanceRef.current || !window.L || !isMapReady) return

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Ajouter les nouveaux marqueurs
    sensors.forEach((sensor) => {
      const icon = createCustomIcon(sensor.status)
      if (!icon) return

      const marker = window.L.marker([sensor.latitude, sensor.longitude], { icon }).addTo(mapInstanceRef.current)

      // Créer le contenu du popup
      const popupContent = `
        <div class="sensor-popup">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-3 h-3 rounded-full" style="background-color: ${getStatusColor(sensor.status)}"></div>
            <h3 class="font-semibold text-gray-900 text-sm">${sensor.name}</h3>
          </div>
          
          <div class="space-y-2 text-xs text-gray-600">
            <div>
              <span class="font-medium">Statut:</span> 
              <span style="color: ${getStatusColor(sensor.status)}">${getStatusText(sensor.status)}</span>
            </div>
            <div>
              <span class="font-medium">Coordonnées:</span><br/>
              ${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}
            </div>
            <div>
              <span class="font-medium">Dernière émission:</span><br/>
              ${formatLastSeen(sensor.lastSeen)}
            </div>
          </div>
          
          <div class="mt-3 pt-2 border-t">
            <a href="/sensors/${sensor.id}" class="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors">
              Voir les détails
            </a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: "custom-popup",
      })

      markersRef.current.push(marker)
    })

    // Ajuster la vue pour inclure tous les marqueurs si il y en a
    if (sensors.length > 0) {
      const group = new window.L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }

  useEffect(() => {
    // Attendre que Leaflet soit chargé
    const checkLeaflet = () => {
      if (window.L) {
        initializeMap()
      } else {
        setTimeout(checkLeaflet, 100)
      }
    }
    checkLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isMapReady) {
      addMarkersToMap()
    }
  }, [sensors, isMapReady])

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-lg relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg border z-[1000]">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Légende</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#28A745]" />
            <span className="text-xs text-gray-700">En ligne</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFC107]" />
            <span className="text-xs text-gray-700">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#DC3545]" />
            <span className="text-xs text-gray-700">Hors ligne</span>
          </div>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  )
}
