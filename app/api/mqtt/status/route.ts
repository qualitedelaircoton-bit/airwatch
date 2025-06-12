import { NextResponse } from "next/server"
import { getMQTTStats, isMQTTConnected } from "@/lib/mqtt-listener"

export async function GET() {
  try {
    const isConnected = isMQTTConnected()
    const stats = getMQTTStats()
    
    const response = {
      connected: isConnected,
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      stats: stats ? {
        connectedAt: stats.connectedAt,
        lastMessage: stats.lastMessage,
        messagesReceived: stats.messagesReceived,
        reconnectCount: stats.reconnectCount,
        errors: stats.errors,
        uptime: stats.connectedAt ? 
          Math.floor((Date.now() - stats.connectedAt.getTime()) / 1000) : null
      } : null,
      broker: {
        url: process.env.MQTT_BROKER_URL || 'mqtts://z166d525.ala.us-east-1.emqxsl.com:8883',
        port: process.env.MQTT_PORT || '8883',
        hasCredentials: !!(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du statut MQTT:", error)
    
    return NextResponse.json(
      {
        connected: false,
        status: 'error',
        error: 'Erreur lors de la récupération du statut',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 