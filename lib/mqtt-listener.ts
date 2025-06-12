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

interface MQTTConnectionStats {
  connectedAt: Date | null
  lastMessage: Date | null
  messagesReceived: number
  reconnectCount: number
  errors: number
}

class MQTTListener {
  private client: mqtt.MqttClient | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private connectionStats: MQTTConnectionStats = {
    connectedAt: null,
    lastMessage: null,
    messagesReceived: 0,
    reconnectCount: 0,
    errors: 0
  }
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || ""
      const port = parseInt(process.env.MQTT_SECURE_PORT || "8883", 10)
      
      // Configuration sécurisée selon les meilleures pratiques 2025
      const options: mqtt.IClientOptions = {
        clientId: `air-quality-listener-${Math.random().toString(16).substr(2, 8)}`,
        username: process.env.MQTT_USERNAME || "",
        password: process.env.MQTT_PASSWORD || "",
        protocol: "mqtts" as const,
        port: port,
        host: brokerUrl, // IP address directly
        clean: true,
        reconnectPeriod: 5000, // 5 secondes de reconnexion
        connectTimeout: 30000, // 30 secondes timeout
        keepalive: 60, // Keep-alive de 60 secondes
        reschedulePings: true,
        protocolVersion: 4, // MQTT 3.1.1 pour compatibilité
        
        // Configuration TLS/SSL renforcée (compatible mqtt.js)
        rejectUnauthorized: true,
        
        // Gestion des sessions persistantes
        properties: {
          sessionExpiryInterval: 3600, // 1 heure pour MQTT 5.0 (si supporté)
          receiveMaximum: 100, // Limiter le nombre de messages non-ACK
        },
        
        // Will message pour notification de déconnexion
        will: {
          topic: 'system/air-quality-listener/status',
          payload: Buffer.from(JSON.stringify({
            status: 'offline',
            timestamp: new Date().toISOString(),
            clientId: `air-quality-listener-${Math.random().toString(16).substr(2, 8)}`
          })),
          qos: 1,
          retain: true
        }
      }

      console.log(`🔌 Tentative de connexion à ${brokerUrl}:${port}`)
      this.client = mqtt.connect(options)

      this.client.on("connect", (connack) => {
        console.log("✅ Connecté au broker MQTT EMQX avec TLS/SSL sécurisé")
        this.connectionStats.connectedAt = new Date()
        this.reconnectAttempts = 0
        this.connectionStats.reconnectCount = this.reconnectAttempts

        // Publier le statut online
        this.publishStatus('online')

        // S'abonner au topic des données de capteurs avec QoS 1 pour garantir la livraison
        this.client?.subscribe("sensors/+/data", { qos: 1 }, (err) => {
          if (err) {
            console.error("❌ Erreur lors de l'abonnement MQTT:", err)
            this.connectionStats.errors++
          } else {
            console.log("📡 Abonné au topic sensors/+/data avec QoS 1")
          }
        })

        // Démarrer le heartbeat
        this.startHeartbeat()
      })

      this.client.on("message", async (topic, message, packet) => {
        try {
          this.connectionStats.lastMessage = new Date()
          this.connectionStats.messagesReceived++
          await this.handleMessage(topic, message)
        } catch (error) {
          console.error("❌ Erreur lors du traitement du message MQTT:", error)
          this.connectionStats.errors++
        }
      })

      this.client.on("error", (error) => {
        console.error("❌ Erreur MQTT:", error)
        this.connectionStats.errors++
        
        // Log détaillé pour le debug
        if (error.message.includes('ENOTFOUND')) {
          console.error("🔍 Erreur DNS : Vérifiez l'URL du broker")
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error("🔍 Connexion refusée : Vérifiez le port et les credentials")
        } else if (error.message.includes('certificate')) {
          console.error("🔍 Erreur certificat : Problème TLS/SSL")
        }
      })

      this.client.on("close", () => {
        console.log("🔌 Connexion MQTT fermée")
        this.stopHeartbeat()
      })

      this.client.on("reconnect", () => {
        this.reconnectAttempts++
        this.connectionStats.reconnectCount = this.reconnectAttempts
        console.log(`🔄 Tentative de reconnexion MQTT (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("❌ Nombre maximum de tentatives de reconnexion atteint")
          this.client?.end(true)
        }
      })

      this.client.on("disconnect", (packet) => {
        console.log("📴 Client déconnecté:", packet)
        this.stopHeartbeat()
      })

      this.client.on("offline", () => {
        console.log("📴 Client hors ligne")
        this.stopHeartbeat()
      })

    } catch (error) {
      console.error("❌ Erreur lors de la configuration MQTT:", error)
      this.connectionStats.errors++
    }
  }

  private startHeartbeat() {
    // Heartbeat toutes les 30 secondes pour monitoring
    this.heartbeatInterval = setInterval(() => {
      if (this.client?.connected) {
        this.publishStatus('online')
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private publishStatus(status: 'online' | 'offline') {
    if (!this.client?.connected) return

    const statusMessage = {
      status,
      timestamp: new Date().toISOString(),
      stats: this.connectionStats,
      version: process.env.npm_package_version || '1.0.0'
    }

    this.client.publish(
      'system/air-quality-listener/status',
      JSON.stringify(statusMessage),
      { qos: 1, retain: true },
      (error) => {
        if (error) {
          console.error("❌ Erreur publication status:", error)
        }
      }
    )
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      // Validation du format du topic
      const topicParts = topic.split("/")
      if (topicParts.length !== 3 || topicParts[0] !== "sensors" || topicParts[2] !== "data") {
        console.warn("⚠️ Format de topic invalide:", topic)
        return
      }

      const sensorId = topicParts[1]
      
      // Validation du contenu JSON
      let data: MQTTSensorData
      try {
        data = JSON.parse(message.toString())
      } catch (parseError) {
        console.error("❌ Erreur parsing JSON:", parseError)
        return
      }

      // Validation des données requises
      if (!this.validateSensorData(data)) {
        console.warn("⚠️ Données de capteur invalides:", sensorId)
        return
      }

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

      // Transaction pour garantir la cohérence des données
      await prisma.$transaction(async (tx) => {
        // Enregistrer les données
        await tx.sensorData.create({
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
        await tx.sensor.update({
          where: { id: sensorId },
          data: { lastSeen: now },
        })

        const newStatus = await calculateSensorStatus(sensorId)
        await tx.sensor.update({
          where: { id: sensorId },
          data: { status: newStatus },
        })
      })

      console.log(`📊 Données reçues et traitées pour le capteur ${sensor.name} (${sensorId})`)
    } catch (error) {
      console.error("❌ Erreur lors du traitement des données MQTT:", error)
      this.connectionStats.errors++
    }
  }

  private validateSensorData(data: any): data is MQTTSensorData {
    const requiredFields = [
      'sensorId', 'timestamp', 'pm1_0', 'pm2_5', 'pm10',
      'o3_raw', 'o3_corrige', 'no2_voltage_mv', 'no2_ppb',
      'voc_voltage_mv', 'co_voltage_mv', 'co_ppb'
    ]

    for (const field of requiredFields) {
      if (!(field in data)) {
        console.warn(`⚠️ Champ manquant: ${field}`)
        return false
      }
    }

    // Validation des types et valeurs
    if (typeof data.sensorId !== 'string' || data.sensorId.length === 0) {
      console.warn("⚠️ sensorId invalide")
      return false
    }

    if (!Date.parse(data.timestamp)) {
      console.warn("⚠️ timestamp invalide")
      return false
    }

    // Validation des valeurs numériques
    const numericFields = [
      'pm1_0', 'pm2_5', 'pm10', 'o3_raw', 'o3_corrige',
      'no2_voltage_mv', 'no2_ppb', 'voc_voltage_mv', 'co_voltage_mv', 'co_ppb'
    ]

    for (const field of numericFields) {
      if (typeof data[field] !== 'number' || isNaN(data[field]) || data[field] < 0) {
        console.warn(`⚠️ Valeur numérique invalide pour ${field}: ${data[field]}`)
        return false
      }
    }

    return true
  }

  public getConnectionStats(): MQTTConnectionStats {
    return { ...this.connectionStats }
  }

  public isConnected(): boolean {
    return this.client?.connected || false
  }

  public async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        // Publier le statut offline avant déconnexion
        this.publishStatus('offline')
        
        // Attendre un peu pour que le message soit envoyé
        setTimeout(() => {
          this.stopHeartbeat()
          this.client?.end(false, {}, () => {
            console.log("🔌 Déconnexion MQTT propre terminée")
            this.client = null
            resolve()
          })
        }, 1000)
      } else {
        resolve()
      }
    })
  }
}

// Instance singleton
let mqttListener: MQTTListener | null = null

export function startMQTTListener(): MQTTListener {
  if (!mqttListener) {
    console.log("🚀 Démarrage du service MQTT Listener")
    mqttListener = new MQTTListener()
  }
  return mqttListener
}

export async function stopMQTTListener(): Promise<void> {
  if (mqttListener) {
    console.log("🛑 Arrêt du service MQTT Listener")
    await mqttListener.disconnect()
    mqttListener = null
  }
}

export function getMQTTStats(): MQTTConnectionStats | null {
  return mqttListener?.getConnectionStats() || null
}

export function isMQTTConnected(): boolean {
  return mqttListener?.isConnected() || false
}
