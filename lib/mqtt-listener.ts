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
      const brokerHost = process.env.MQTT_HOST || process.env.MQTT_BROKER_URL || ""
      const port = Number.parseInt(process.env.MQTT_PORT || "1883", 10)
      
      // Configuration identique au simulateur qui fonctionne
      const options: mqtt.IClientOptions = {
        host: brokerHost,
        port: port,
        protocol: "mqtt" as const,
        clientId: `air-quality-listener-${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 1000,
        keepalive: 60,
        rejectUnauthorized: false,
        protocolVersion: 4, // MQTT 3.1.1 pour compatibilité
        

        
        // Will message pour notification de déconnexion
        will: {
          topic: `system/air-quality-listener/status`,
          payload: "offline",
          qos: 1,
          retain: false,
        }
      }

      console.log(`🔌 Tentative de connexion à ${brokerHost}:${port}`)
      const brokerUrl = `${options.protocol}://${brokerHost}:${port}`
      this.client = mqtt.connect(brokerUrl, options)

      this.client.on("connect", (connack) => {
        console.log("✅ Connecté au broker MQTT en mode standard")
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
      let rawData: any
      try {
        rawData = JSON.parse(message.toString())
      } catch (parseError) {
        console.error("❌ Erreur parsing JSON:", parseError)
        return
      }

      // Transformer les données du format de l'appareil vers le format attendu
      const transformedData = this.transformDeviceData(rawData, sensorId)
      if (!transformedData) {
        console.warn("⚠️ Format de données de l'appareil invalide:", sensorId, rawData)
        return
      }

      // Validation des données transformées
      if (!this.validateSensorData(transformedData)) {
        console.warn("⚠️ Données de capteur invalides après transformation:", sensorId)
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
            sensorId: transformedData.sensorId,
            timestamp: new Date(transformedData.timestamp),
            pm1_0: transformedData.pm1_0,
            pm2_5: transformedData.pm2_5,
            pm10: transformedData.pm10,
            o3_raw: transformedData.o3_raw,
            o3_corrige: transformedData.o3_corrige,
            no2_voltage_mv: transformedData.no2_voltage_mv,
            no2_ppb: transformedData.no2_ppb,
            voc_voltage_mv: transformedData.voc_voltage_mv,
            co_voltage_mv: transformedData.co_voltage_mv,
            co_ppb: transformedData.co_ppb,
            rawData: rawData, // Conserver les données brutes originales
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

  // Fonction pour transformer les données de l'appareil vers le format attendu
  private transformDeviceData(rawData: any, sensorId: string): MQTTSensorData | null {
    try {
      // Format attendu de l'appareil : {"ts":113,"PM1":12,"PM25":17,"PM10":20,"O3":83,"O3c":53,"NO2v":0.01,"NO2":0,"VOCv":0.08,"COv":0.40,"CO":0}
      
      // Validation des champs requis du format de l'appareil
      const requiredDeviceFields = ['ts', 'PM1', 'PM25', 'PM10', 'O3', 'O3c', 'NO2v', 'NO2', 'VOCv', 'COv', 'CO']
      
      for (const field of requiredDeviceFields) {
        if (!(field in rawData)) {
          console.warn(`⚠️ Champ manquant du format appareil: ${field}`)
          return null
        }
      }

      // Validation des types numériques
      for (const field of requiredDeviceFields) {
        if (typeof rawData[field] !== 'number' || isNaN(rawData[field])) {
          console.warn(`⚠️ Valeur numérique invalide pour ${field}: ${rawData[field]}`)
          return null
        }
      }

      // Transformer le timestamp
      let timestamp: string
      if (typeof rawData.ts === 'number') {
        // Si le nombre est petit (< 10000000000), c'est probablement en secondes depuis epoch Unix
        const tsValue = rawData.ts < 10000000000 ? rawData.ts * 1000 : rawData.ts
        timestamp = new Date(tsValue).toISOString()
      } else {
        timestamp = new Date().toISOString()
      }

      // Transformer vers le format attendu
      return {
        sensorId,
        timestamp,
        pm1_0: Number(rawData.PM1),
        pm2_5: Number(rawData.PM25),
        pm10: Number(rawData.PM10),
        o3_raw: Number(rawData.O3),
        o3_corrige: Number(rawData.O3c),
        no2_voltage_mv: Number(rawData.NO2v),
        no2_ppb: Number(rawData.NO2),
        voc_voltage_mv: Number(rawData.VOCv),
        co_voltage_mv: Number(rawData.COv),
        co_ppb: Number(rawData.CO),
      }
    } catch (error) {
      console.error("❌ Erreur lors de la transformation des données de l'appareil:", error)
      return null
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
