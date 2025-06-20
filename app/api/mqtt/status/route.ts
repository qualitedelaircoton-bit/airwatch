import { NextResponse } from "next/server"
import { startMQTTListener, stopMQTTListener, isMQTTConnected, getMQTTStats } from "@/lib/mqtt-listener"

export async function GET() {
  try {
    const isConnected = isMQTTConnected()
    const stats = getMQTTStats()
    
    return NextResponse.json({
      connected: isConnected,
      stats: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function POST() {
  try {
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
      connected: isConnected,
      stats: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Erreur lors du redémarrage MQTT:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
} 