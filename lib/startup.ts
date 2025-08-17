import { realtimeService } from "./realtime-service"

export function startServices() {
  console.log("🚀 Démarrage des services...")

  // Note: MQTT WebSocket supprimé - on utilise maintenant le webhook Firebase + Firestore real-time
  console.log("ℹ️ MQTT WebSocket retiré - utilisation du webhook Firebase + Firestore real-time")

  // Démarrer le service de mise à jour temps réel (pour les tâches périodiques)
  realtimeService.start()

  console.log("✅ Services démarrés avec succès")
}

export function stopServices() {
  realtimeService.stop()
  console.log("🛑 Services arrêtés")
}
