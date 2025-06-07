import { EventEmitter } from "events"

class RealtimeService extends EventEmitter {
  private updateInterval: NodeJS.Timeout | null = null
  private isRunning = false

  start() {
    if (this.isRunning) return

    this.isRunning = true

    // Mettre à jour les statuts toutes les minutes
    this.updateInterval = setInterval(async () => {
      try {
        const { updateAllSensorStatuses } = await import("./status-calculator")
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

  getStatus() {
    return this.isRunning
  }
}

export const realtimeService = new RealtimeService()
