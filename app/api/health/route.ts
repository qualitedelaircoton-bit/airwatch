import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // Test de la base de données (Firestore Admin)
    if (!adminDb) {
      console.error("Firestore Admin SDK is not initialized.");
      return NextResponse.json({ error: "Database not initialized" }, { status: 503 });
    }
    await adminDb.collection("sensors").limit(1).get();
    
    return NextResponse.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: "firebase-hosting",
      mode: "webhook + firestore-realtime",
      message: "Firebase services opérationnels - MQTT via webhook + Firestore real-time"
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
