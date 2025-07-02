import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateSensorStatus } from "@/lib/status-calculator"
import { realtimeService } from "@/lib/realtime-service"

interface WebhookPayload {
  clientid: string
  username?: string
  topic: string
  payload: string
  qos: number
  retain: boolean
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    console.log("📡 Webhook MQTT reçu")
    
    // Vérifier l'authentification du webhook (optionnel mais recommandé)
    const authHeader = request.headers.get("authorization")
    const expectedAuth = process.env.MQTT_WEBHOOK_SECRET
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json() as WebhookPayload
    console.log("📋 Payload reçu:", JSON.stringify(body, null, 2))

    // Extraire l'ID du capteur depuis le topic
    const topicMatch = body.topic.match(/^sensors\/([^/]+)\/data$/)
    if (!topicMatch) {
      console.error("❌ Format de topic invalide:", body.topic)
      return NextResponse.json({ 
        error: "Invalid topic format",
        expected: "sensors/{sensorId}/data",
        received: body.topic
      }, { status: 400 })
    }

    const sensorId = topicMatch[1]!
    console.log("🎯 ID capteur extrait:", sensorId)

    // Vérifier que le capteur existe
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId }
    })

    if (!sensor) {
      console.error("❌ Capteur introuvable:", sensorId)
      return NextResponse.json({ 
        error: "Unknown sensor",
        sensorId: sensorId
      }, { status: 404 })
    }

    // Parser les données du payload
    let data
    try {
      data = JSON.parse(body.payload)
    } catch (error) {
      console.error("❌ Erreur parsing JSON:", error)
      return NextResponse.json({ 
        error: "Invalid JSON payload",
        payload: body.payload
      }, { status: 400 })
    }

    console.log("📊 Données parsées:", data)

    // Validation et transformation des données selon le schéma Prisma
    const timestamp = data.ts ? new Date(data.ts * 1000) : new Date()
    
    const sensorData = {
      sensorId: sensorId,
      timestamp: timestamp,
      // Particules (µg/m³)
      pm1_0: data.PM1 ? parseFloat(data.PM1) : 0,
      pm2_5: data.PM25 ? parseFloat(data.PM25) : 0,
      pm10: data.PM10 ? parseFloat(data.PM10) : 0,
      // Ozone
      o3_raw: data.O3 ? parseFloat(data.O3) : 0,
      o3_corrige: data.O3c ? parseFloat(data.O3c) : 0,
      // Dioxyde d'azote
      no2_voltage_mv: data.NO2v ? parseFloat(data.NO2v) * 1000 : 0, // Convertir V en mV
      no2_ppb: data.NO2 ? parseFloat(data.NO2) : 0,
      // Composés organiques volatils
      voc_voltage_mv: data.VOCv ? parseFloat(data.VOCv) * 1000 : 0, // Convertir V en mV
      // Monoxyde de carbone
      co_voltage_mv: data.COv ? parseFloat(data.COv) * 1000 : 0, // Convertir V en mV
      co_ppb: data.CO ? parseFloat(data.CO) : 0,
      // Conditions météorologiques (optionnel)
      temperature: data.temp ? parseFloat(data.temp) : null,
      humidity: data.hum ? parseFloat(data.hum) : null,
      pressure: data.pres ? parseFloat(data.pres) : null,
      // Métadonnées
      rawData: data, // Garder les données brutes
      processed: false
    }

    console.log("💾 Données à sauvegarder:", sensorData)

    // Sauvegarder dans la base de données
    const savedData = await prisma.sensorData.create({
      data: sensorData
    })

    // Calculer et mettre à jour le statut du capteur
    const status = await calculateSensorStatus(sensorId)
    await prisma.sensor.update({
      where: { id: sensorId },
      data: { 
        status: status,
        lastSeen: timestamp,
        isActive: true
      }
    })

    // Déclencher une mise à jour immédiate via le service temps réel
    await realtimeService.triggerWebhookUpdate(sensorId, {
      sensorName: sensor.name,
      status: status,
      timestamp: timestamp,
      data: sensorData
    })

    console.log("✅ Données sauvegardées avec succès")
    console.log(`📊 Données reçues et traitées pour le capteur ${sensor.name}`)

    return NextResponse.json({
      success: true,
      message: `Données reçues pour ${sensor.name}`,
      dataId: savedData.id,
      status: status,
      timestamp: timestamp.toISOString(),
      receivedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Erreur traitement webhook:", error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Pour les tests de connectivité
export async function GET() {
  return NextResponse.json({
    service: "MQTT Webhook",
    status: "active",
    environment: process.env.VERCEL === '1' ? 'vercel-production' : 'local-development',
    endpoint: "/api/mqtt/webhook",
    method: "POST",
    timestamp: new Date().toISOString()
  })
} 