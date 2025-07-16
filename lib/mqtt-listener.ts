import mqtt from "mqtt"
import { db } from "./firebase"
import { doc, getDoc, collection, writeBatch, serverTimestamp } from "firebase/firestore"
import { calculateSensorStatus } from "./firestore-status-calculator"
import { transformDeviceData, validateSensorData, type MQTTSensorData } from '../functions/src/lib/shared-data-handler';

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
        protocolVersion: 4,
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

      this.client.on("connect", () => {
        console.log("✅ Connecté au broker MQTT")
        this.connectionStats.connectedAt = new Date()
        this.reconnectAttempts = 0
        this.connectionStats.reconnectCount = this.reconnectAttempts
        this.publishStatus('online')
        this.client?.subscribe("sensors/+/data", { qos: 1 }, (err) => {
          if (err) {
            console.error("❌ Erreur lors de l'abonnement MQTT:", err)
            this.connectionStats.errors++
          } else {
            console.log("📡 Abonné au topic sensors/+/data avec QoS 1")
          }
        })
        this.startHeartbeat()
      })

      this.client.on("message", async (topic, message) => {
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
      })

      this.client.on("close", () => {
        console.log("🔌 Connexion MQTT fermée")
        this.stopHeartbeat()
      })

      this.client.on("reconnect", () => {
        this.reconnectAttempts++
        this.connectionStats.reconnectCount = this.reconnectAttempts
        console.log(`⏳ Tentative de reconnexion MQTT (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("❌ Échec de la reconnexion. Arrêt.")
          this.client?.end(true)
        }
      })

    } catch (error) {
      console.error("❌ Erreur critique lors de l'initialisation MQTT:", error)
      this.connectionStats.errors++
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      this.publishStatus('online')
    }, 30000)
    console.log("💓 Heartbeat démarré")
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
      console.log("💔 Heartbeat arrêté")
    }
  }

  private publishStatus(status: 'online' | 'offline') {
    if (this.client?.connected) {
      const statusTopic = `system/air-quality-listener/status`
      this.client.publish(statusTopic, status, { qos: 1, retain: false })
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    const topicParts = topic.split('/')
    if (topicParts.length !== 3 || topicParts[0] !== 'sensors' || topicParts[2] !== 'data') return

    const sensorId = topicParts[1]
    if (!sensorId) {
        console.warn(`⚠️ ID de capteur vide ou manquant dans le topic: ${topic}`)
        return
    }

    let rawData: any
    try {
      rawData = JSON.parse(message.toString())
    } catch (e) {
      console.error(`❌ Erreur de parsing JSON pour ${topic}:`, e)
      this.connectionStats.errors++
      return
    }

    const transformedData = this.transformDeviceData(rawData, sensorId)
    if (!transformedData || !this.validateSensorData(transformedData)) {
      console.warn(`⚠️ Données invalides pour ${sensorId}, message ignoré.`)
      return
    }

    const sensorRef = doc(db, "sensors", sensorId)
    const sensorSnap = await getDoc(sensorRef)
    if (!sensorSnap.exists()) {
      console.warn(`⚠️ Capteur ${sensorId} non trouvé. Message ignoré.`)
      return
    }

    console.log(`✅ Message reçu pour '${sensorSnap.data().name}' (${sensorId})`)
    const batch = writeBatch(db)
    const dataRef = doc(collection(db, "sensors", sensorId, "data"))
    batch.set(dataRef, {
      ...transformedData,
      timestamp: serverTimestamp(),
      rawData: message.toString()
    })
    batch.update(sensorRef, {
      lastSeen: serverTimestamp(),
      status: await calculateSensorStatus(sensorId),
      isActive: true
    })

    try {
      await batch.commit()
    } catch (error) {
      console.error(`❌ Erreur commit batch pour ${sensorId}:`, error)
      this.connectionStats.errors++
    }
  }

  private transformDeviceData(rawData: any, sensorId: string): MQTTSensorData | null {
    return transformDeviceData(rawData, sensorId);
  }

  private validateSensorData(data: any): data is MQTTSensorData {
    return validateSensorData(data);
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
        this.publishStatus('offline')
        setTimeout(() => {
          this.stopHeartbeat()
          this.client?.end(false, {}, () => {
            console.log("🔌 Déconnexion MQTT propre.")
            this.client = null
            resolve()
          })
        }, 500)
      } else {
        resolve()
      }
    })
  }
}

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
