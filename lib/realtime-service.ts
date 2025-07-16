import { EventEmitter } from "events"

class RealtimeService extends EventEmitter {
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private lastWebhookUpdate: Date | null = null

  start() {
    if (this.isRunning) return

    this.isRunning = true

    // Mettre à jour les statuts toutes les minutes
    this.updateInterval = setInterval(async () => {
      try {
        const { updateAllSensorStatuses } = await import("./firestore-status-calculator")
        await updateAllSensorStatuses()
        this.emit("statusUpdate")
      } catch (error) {
        console.error("Erreur lors de la mise à jour des statuts:", error)
      }
    }, 60000) // 1 minute

    console.log("🔄 Service de mise à jour temps réel démarré")
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
    console.log("⏹️ Service de mise à jour temps réel arrêté")
  }

  // Méthode appelée par le webhook pour déclencher une mise à jour immédiate
  async triggerWebhookUpdate(sensorId: string, data: any) {
    try {
      console.log(`🚀 Mise à jour immédiate déclenchée pour le capteur ${sensorId}`)
      
      // Mettre à jour le statut du capteur spécifique
      const { calculateSensorStatus } = await import("./firestore-status-calculator")
      await calculateSensorStatus(sensorId)
      
      this.lastWebhookUpdate = new Date()
      
      // Émettre l'événement avec les détails de la mise à jour
      this.emit("webhookUpdate", {
        sensorId,
        data,
        timestamp: this.lastWebhookUpdate
      })
      
      console.log(`✅ Mise à jour webhook terminée pour ${sensorId}`)
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour webhook:", error)
    }
  }

  getStatus() {
    return this.isRunning
  }

  getLastWebhookUpdate() {
    return this.lastWebhookUpdate
  }
}

export const realtimeService = new RealtimeService()
