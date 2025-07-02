import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { realtimeService } from "@/lib/realtime-service"

export async function GET() {
  try {
    // Récupérer les dernières données de chaque capteur
    const sensors = await prisma.sensor.findMany({
      select: {
        id: true,
        name: true,
        lastSeen: true,
        status: true,
        data: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1,
          select: {
            timestamp: true,
            pm2_5: true,
            pm10: true,
            o3_corrige: true,
            no2_ppb: true,
            co_ppb: true
          }
        }
      }
    })

    // Calculer la dernière mise à jour webhook
    const lastWebhookUpdate = realtimeService.getLastWebhookUpdate()

    // Trouver la plus récente des dernières données
    const latestDataTimestamp = sensors.reduce((latest, sensor) => {
      const sensorLatest = sensor.data[0]?.timestamp
      return sensorLatest && sensorLatest > latest ? sensorLatest : latest
    }, new Date(0))

    return NextResponse.json({
      lastWebhookUpdate: lastWebhookUpdate?.getTime() || null,
      lastDataUpdate: latestDataTimestamp.getTime(),
      sensorsCount: sensors.length,
      activeSensors: sensors.filter(s => s.status !== 'RED').length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des dernières mises à jour:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 