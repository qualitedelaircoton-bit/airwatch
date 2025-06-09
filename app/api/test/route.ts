import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Test API - Début")
    
    // Test simple de connexion
    const sensorCount = await prisma.sensor.count()
    console.log(`📊 Capteurs trouvés: ${sensorCount}`)
    
    const sensors = await prisma.sensor.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        status: true,
        latitude: true,
        longitude: true,
        lastSeen: true,
        frequency: true
      }
    })
    
    console.log("✅ Requête réussie")
    
    return NextResponse.json({ 
      success: true, 
      count: sensorCount,
      sensors: sensors,
      message: "API fonctionnelle"
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