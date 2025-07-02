import { NextResponse } from "next/server"
import { startMQTTListener, stopMQTTListener, isMQTTConnected, getMQTTStats } from "@/lib/mqtt-listener"

export async function GET() {
  try {
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // En production Vercel, pas de MQTT listener persistant
      return NextResponse.json({
        mode: "webhook",
        environment: "vercel-production",
        message: "Utilise /api/mqtt/webhook pour recevoir les données",
        timestamp: new Date().toISOString()
      })
    } else {
      // En local, vérifier le MQTT listener
      const isConnected = isMQTTConnected()
      const stats = getMQTTStats()
      
      return NextResponse.json({
        mode: "persistent-listener",
        environment: "local-development",
        connected: isConnected,
        stats: stats,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // En production Vercel, pas de redémarrage possible
      return NextResponse.json({
        message: "Redémarrage non applicable en production Vercel",
        mode: "webhook",
        environment: "vercel-production",
        info: "Les données arrivent via webhook /api/mqtt/webhook",
        timestamp: new Date().toISOString()
      })
    } else {
      // En local, redémarrer le MQTT listener
      console.log("🔧 Redémarrage du MQTT Listener demandé via API...")
      
      // Arrêter le listener actuel
      await stopMQTTListener()
      
      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redémarrer
      startMQTTListener()
      
      // Attendre et vérifier
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const isConnected = isMQTTConnected()
      const stats = getMQTTStats()
      
      return NextResponse.json({
        message: "MQTT Listener redémarré",
        mode: "persistent-listener",
        environment: "local-development",
        connected: isConnected,
        stats: stats,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("Erreur lors du redémarrage MQTT:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 