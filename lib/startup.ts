import { startMQTTListener } from "./mqtt-listener"
import { realtimeService } from "./realtime-service"

export function startServices() {
  console.log("🚀 Démarrage des services...")

  // Démarrer le listener MQTT
  startMQTTListener()

  // Démarrer le service de mise à jour temps réel
  realtimeService.start()

  console.log("✅ Services démarrés avec succès")
}

export function stopServices() {
  const { stopMQTTListener } = require("./mqtt-listener")
  stopMQTTListener()
  realtimeService.stop()
  console.log("🛑 Services arrêtés")
}
