import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startMQTTListener, isMQTTConnected, getMQTTStats } from "@/lib/mqtt-listener"

export async function GET() {
  try {
    // Test de la base de données
    await prisma.$queryRaw`SELECT 1`
    
    // Vérifier et démarrer le MQTT Listener si nécessaire
    let mqttStatus = isMQTTConnected()
    
    if (!mqttStatus) {
      console.log("🔧 MQTT Listener non connecté, redémarrage...")
      startMQTTListener()
      
      // Attendre un peu et revérifier
      await new Promise(resolve => setTimeout(resolve, 3000))
      mqttStatus = isMQTTConnected()
    }
    
    const mqttStats = getMQTTStats()
    
    return NextResponse.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      mqtt: {
        connected: mqttStatus,
        stats: mqttStats
      },
      message: mqttStatus ? "Tous les services fonctionnent" : "MQTT en cours de reconnexion"
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
