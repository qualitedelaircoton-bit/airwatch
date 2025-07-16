import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export async function GET() {
  try {
    console.log("🔍 Test API - Début")

    // Test simple de connexion Firestore
    const sensorsRef = collection(db, "sensors")
    const snapshot = await getDocs(sensorsRef)
    const sensorCount = snapshot.size
    console.log(`📊 Capteurs trouvés: ${sensorCount}`)

    const sensors = snapshot.docs.slice(0, 3).map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))

    console.log("✅ Requête réussie")
    return NextResponse.json({
      success: true,
      count: sensorCount,
      sensors,
      message: "API fonctionnelle (Firestore)"
    })
  } catch (error) {
    console.error("❌ Erreur API:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}