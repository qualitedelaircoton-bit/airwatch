"use client"

import { useEffect, useRef, useState } from "react"
import { SensorCard } from "@/components/sensor-card"
import { formatFirestoreTimestamp } from "@/lib/date-utils"

interface Sensor {
  id: string
  name: string
  latitude: number
  longitude: number
  lastSeen: string | null | { seconds: number; nanoseconds: number }
  status: "GREEN" | "ORANGE" | "RED"
  frequency: number
}

interface CenterOptions {
  center: [number, number]
  zoom: number
}

interface MapViewProps {
  sensors: Sensor[]
  centerOptions?: CenterOptions | undefined
}

declare global {
  interface Window {
    L: any
  }
}

export function MapView({ sensors, centerOptions }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isMapReady, setIsMapReady] = useState(false)

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

  const createCustomIcon = (status: string) => {
    if (!window.L) return null

    const color = getStatusHexColor(status)
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-${status}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="16" cy="16" r="12" fill="${color}" opacity="0.2" />
        <circle cx="16" cy="16" r="8" fill="${color}" stroke="white" stroke-width="3" filter="url(#glow-${status})" />
        <circle cx="16" cy="16" r="4" fill="white" />
      </svg>
    `

    return window.L.divIcon({
      html: svgIcon,
      className: "custom-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return

    // Coordonnées du Bénin : centre approximatif
    const beninCenter: [number, number] = [9.3077, 2.3158]
    const defaultZoom = 7

    // Utiliser les options de centrage si fournies, sinon utiliser les valeurs par défaut
    const mapCenter = centerOptions?.center || beninCenter
    const mapZoom = centerOptions?.zoom || defaultZoom

    // Initialiser la carte
    const map = window.L.map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
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

      // Créer un div temporaire pour rendre le composant React
      const tempDiv = document.createElement('div')
      
      // Nous devons utiliser ReactDOM.render pour rendre le composant dans le div
      // Pour l'instant, nous allons créer le contenu manuellement mais de façon similaire au composant
      const createPopupContent = () => {
        tempDiv.innerHTML = ''
        tempDiv.className = 'max-w-xs'
        
        // Créer le composant SensorCard en mode popup
        const cardElement = document.createElement('div')
        cardElement.innerHTML = `
          <div class="sensor-card glass-effect border-2 bg-card rounded-lg shadow-lg p-4">
            <div class="pb-3">
              <div class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-full shrink-0 mt-0.5 shadow-lg glow-red" 
                     style="background-color: ${sensor.status === 'RED' ? 'var(--color-air-red)' : 
                            sensor.status === 'GREEN' ? '#28A745' : 
                            sensor.status === 'ORANGE' ? '#FFC107' : '#6C757D'}"></div>
                <h3 class="text-base font-semibold line-clamp-2 leading-tight text-card-foreground">${sensor.name}</h3>
              </div>
            </div>
            <div class="pt-0 space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted-foreground">Statut:</span>
                <div class="px-2 py-1 rounded-full text-xs font-medium border-2 ${
                  sensor.status === "GREEN" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30" :
                  sensor.status === "ORANGE" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800/30" :
                  sensor.status === "RED" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30" :
                  "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-800/30"
                }" ${sensor.status === 'RED' ? 'style="color: var(--color-air-red)"' : ''}>
                  <span class="flex items-center gap-1">
                    ${sensor.status === 'GREEN' ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' :
                      sensor.status === 'ORANGE' ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' :
                      '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>'}
                    ${sensor.status === 'GREEN' ? 'En ligne' : sensor.status === 'ORANGE' ? 'En retard' : 'Hors ligne'}
                  </span>
                </div>
              </div>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Dernière:</span>
                  <div class="text-xs font-medium text-foreground">
                    ${formatFirestoreTimestamp(sensor.lastSeen, "dd/MM/yy HH:mm")}
                  </div>
                </div>

                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground">Coordonnées:</span>
                  <div class="text-xs font-medium text-foreground font-mono">
                    ${sensor.latitude.toFixed(4)}, ${sensor.longitude.toFixed(4)}
                  </div>
                </div>

                <div class="flex justify-between items-center pt-2 border-t border-border/50">
                  <span class="text-muted-foreground">Fréquence:</span>
                  <span class="font-semibold text-primary">${sensor.frequency} min</span>
                </div>
              </div>

                             <div class="mt-4 pt-3 border-t border-border/50">
                 <a href="/sensors/${sensor.id}" 
                     class="block w-full text-center bg-white hover:bg-gray-50 text-gray-900 text-xs py-2.5 px-4 rounded-lg hover:scale-105 transition-all duration-200 font-medium shadow-lg border-2 border-blue-600 hover:border-blue-700">
                   📊 Voir les détails
                 </a>
               </div>
            </div>
          </div>
        `
        
        tempDiv.appendChild(cardElement)
        return tempDiv.innerHTML
      }

      // Configurer le popup avec auto-hide
      const popup = window.L.popup({
        maxWidth: 350,
        className: "custom-popup",
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
      }).setContent(createPopupContent())

      marker.bindPopup(popup)

      // Variables pour gérer l'auto-hide
      let hideTimeout: NodeJS.Timeout | null = null

      // Fonction pour nettoyer le timeout
      const clearHideTimeout = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout)
          hideTimeout = null
        }
      }

      // Fonction pour démarrer l'auto-hide
      const startAutoHide = () => {
        clearHideTimeout()
        hideTimeout = setTimeout(() => {
          marker.closePopup()
        }, 2000) // 2 secondes de délai
      }

      // Événements du marqueur
      marker.on('click', () => {
        clearHideTimeout()
        marker.openPopup()
      })

      marker.on('mouseover', () => {
        clearHideTimeout()
      })

      marker.on('mouseout', () => {
        // Vérifier si la souris n'est pas sur le popup
        const popupElement = document.querySelector('.leaflet-popup')
        if (popupElement && marker.isPopupOpen()) {
          startAutoHide()
        }
      })

      // Événements du popup
      marker.on('popupopen', () => {
        clearHideTimeout()
        
        // Ajouter des événements au popup pour gérer l'auto-hide
        const popupElement = document.querySelector('.leaflet-popup')
        if (popupElement) {
          popupElement.addEventListener('mouseenter', clearHideTimeout)
          popupElement.addEventListener('mouseleave', startAutoHide)
        }
      })

      marker.on('popupclose', () => {
        clearHideTimeout()
        
        // Nettoyer les événements du popup
        const popupElement = document.querySelector('.leaflet-popup')
        if (popupElement) {
          popupElement.removeEventListener('mouseenter', clearHideTimeout)
          popupElement.removeEventListener('mouseleave', startAutoHide)
        }
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
        setIsMapReady(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isMapReady) {
      addMarkersToMap()
    }
  }, [sensors, isMapReady])

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-xl border-2 border-border/50 relative">
      {!isMapReady && (
        <div className="absolute inset-0 glass-effect flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {sensors.length === 0 && isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center max-w-sm p-6">
            <div className="w-16 h-16 rounded-full glass-effect flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun capteur sur la carte</h3>
            <p className="text-muted-foreground text-sm">Ajoutez des capteurs pour voir leur localisation ici.</p>
          </div>
        </div>
      )}
    </div>
  )
}
