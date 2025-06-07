import mqtt from "mqtt"
import { prisma } from "./prisma"
import { calculateSensorStatus } from "./status-calculator"

interface MQTTSensorData {
  sensorId: string
  timestamp: string
  pm1_0: number
  pm2_5: number
  pm10: number
  o3_raw: number
  o3_corrige: number
  no2_voltage_mv: number
  no2_ppb: number
  voc_voltage_mv: number
  co_voltage_mv: number
  co_ppb: number
}

class MQTTListener {
  private client: mqtt.MqttClient | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || "mqtts://z166d525.ala.us-east-1.emqxsl.com:8883"

      const options: mqtt.IClientOptions = {
        clientId: `air-quality-listener-${Math.random().toString(16).substr(2, 8)}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        protocol: "mqtts",
        port: 8883,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        rejectUnauthorized: true, // Vérifier les certificats SSL
      }

      this.client = mqtt.connect(brokerUrl, options)

      this.client.on("connect", () => {
        console.log("✅ Connecté au broker MQTT EMQX avec TLS/SSL")
        this.reconnectAttempts = 0

        // S'abonner au topic des données de capteurs
        this.client?.subscribe("sensors/+/data", (err) => {
          if (err) {
            console.error("❌ Erreur lors de l'abonnement MQTT:", err)
          } else {
            console.log("📡 Abonné au topic sensors/+/data")
          }
        })
      })

      this.client.on("message", async (topic, message) => {
        try {
          await this.handleMessage(topic, message)
        } catch (error) {
          console.error("❌ Erreur lors du traitement du message MQTT:", error)
        }
      })

      this.client.on("error", (error) => {
        console.error("❌ Erreur MQTT:", error)
      })

      this.client.on("close", () => {
        console.log("🔌 Connexion MQTT fermée")
      })

      this.client.on("reconnect", () => {
        this.reconnectAttempts++
        console.log(`🔄 Tentative de reconnexion MQTT (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("❌ Nombre maximum de tentatives de reconnexion atteint")
          this.client?.end()
        }
      })
    } catch (error) {
      console.error("❌ Erreur lors de la connexion MQTT:", error)
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      // Extraire l'ID du capteur du topic (sensors/{sensorId}/data)
      const topicParts = topic.split("/")
      if (topicParts.length !== 3 || topicParts[0] !== "sensors" || topicParts[2] !== "data") {
        console.warn("⚠️ Format de topic invalide:", topic)
        return
      }

      const sensorId = topicParts[1]
      const data: MQTTSensorData = JSON.parse(message.toString())

      // Valider que l'ID du capteur correspond
      if (data.sensorId !== sensorId) {
        console.warn("⚠️ ID de capteur incohérent:", { topic: sensorId, data: data.sensorId })
        return
      }

      // Vérifier que le capteur existe
      const sensor = await prisma.sensor.findUnique({
        where: { id: sensorId },
      })

      if (!sensor) {
        console.warn("⚠️ Capteur inconnu:", sensorId)
        return
      }

      // Enregistrer les données
      await prisma.sensorData.create({
        data: {
          sensorId: data.sensorId,
          timestamp: new Date(data.timestamp),
          pm1_0: data.pm1_0,
          pm2_5: data.pm2_5,
          pm10: data.pm10,
          o3_raw: data.o3_raw,
          o3_corrige: data.o3_corrige,
          no2_voltage_mv: data.no2_voltage_mv,
          no2_ppb: data.no2_ppb,
          voc_voltage_mv: data.voc_voltage_mv,
          co_voltage_mv: data.co_voltage_mv,
          co_ppb: data.co_ppb,
        },
      })

      // Mettre à jour lastSeen et recalculer le statut
      const now = new Date()
      await prisma.sensor.update({
        where: { id: sensorId },
        data: { lastSeen: now },
      })

      const newStatus = await calculateSensorStatus(sensorId)
      await prisma.sensor.update({
        where: { id: sensorId },
        data: { status: newStatus },
      })

      console.log(`📊 Données reçues pour le capteur ${sensor.name} (${sensorId})`)
    } catch (error) {
      console.error("❌ Erreur lors du traitement des données MQTT:", error)
    }
  }

  public disconnect() {
    if (this.client) {
      this.client.end()
      this.client = null
    }
  }
}

// Instance singleton
let mqttListener: MQTTListener | null = null

export function startMQTTListener() {
  if (!mqttListener) {
    mqttListener = new MQTTListener()
  }
  return mqttListener
}

export function stopMQTTListener() {
  if (mqttListener) {
    mqttListener.disconnect()
    mqttListener = null
  }
}
