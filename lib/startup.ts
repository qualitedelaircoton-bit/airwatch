import { startMQTTListener } from "./mqtt-listener"
import { realtimeService } from "./realtime-service"

export function startServices() {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_SERVICES === "true") {
    console.log("🚀 Démarrage des services...")

    // Démarrer le listener MQTT
    startMQTTListener()

    // Démarrer le service de mise à jour temps réel
    realtimeService.start()

    console.log("✅ Services démarrés avec succès")
  } else {
    console.log("⚠️ Services désactivés en mode développement")
  }
}

export function stopServices() {
  const { stopMQTTListener } = require("./mqtt-listener")
  stopMQTTListener()
  realtimeService.stop()
  console.log("🛑 Services arrêtés")
}
