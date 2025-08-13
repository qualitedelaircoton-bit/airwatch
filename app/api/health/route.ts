import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { startMQTTListener, isMQTTConnected, getMQTTStats } from "@/lib/mqtt-listener";

export async function GET() {
  try {
    // Test de la base de données (Firestore Admin)
    if (!adminDb) {
      console.error("Firestore Admin SDK is not initialized.");
      return NextResponse.json({ error: "Database not initialized" }, { status: 503 });
    }
    await adminDb.collection("sensors").limit(1).get();
    
    let mqttStatus = isMQTTConnected()
    
    if (!mqttStatus) {
      console.log("🔧 MQTT Listener non connecté, redémarrage...")
      startMQTTListener()
      
      // Attendre un peu et revérifier
      await new Promise(resolve => setTimeout(resolve, 3000))
      mqttStatus = isMQTTConnected()
    }
    
    const mqttStats = getMQTTStats()
    
    return NextResponse.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: "local-development",
      mqttMode: "persistent-listener",
      mqtt: {
        connected: mqttStatus,
        stats: mqttStats
      },
      message: mqttStatus ? "Tous les services fonctionnent" : "MQTT en cours de reconnexion"
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
