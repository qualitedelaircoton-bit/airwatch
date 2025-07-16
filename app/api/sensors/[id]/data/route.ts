import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, updateDoc, doc, getDoc, query, where, orderBy } from "firebase/firestore"
import { calculateSensorStatus } from "@/lib/firestore-status-calculator"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) {
      return NextResponse.json({ error: "Missing date range parameters" }, { status: 400 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const dataRef = collection(db, "sensors", id, "data")
    const q = query(
      dataRef,
      where("timestamp", ">=", fromDate),
      where("timestamp", "<=", toDate),
      orderBy("timestamp", "asc")
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sensorId } = await params
    const body = await request.json()

    console.log(`📊 Données reçues pour capteur ${sensorId}:`, body)

    // Transformer le format de données de l'appareil vers Firestore
    const transformedData = transformSensorData(body, sensorId)
    if (!transformedData) {
      console.error("❌ Format de données invalide:", body)
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Vérifier que le capteur existe
    const sensorRef = doc(db, "sensors", sensorId)
    const sensorSnap = await getDoc(sensorRef)
    if (!sensorSnap.exists()) {
      console.warn("⚠️ Capteur inconnu:", sensorId)
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }
    const sensorData = sensorSnap.data() as any

    // Enregistrer les données
    const dataRef = collection(db, "sensors", sensorId, "data")
    await addDoc(dataRef, {
      timestamp: transformedData.timestamp,
      pm1_0: transformedData.pm1_0,
      pm2_5: transformedData.pm2_5,
      pm10: transformedData.pm10,
      o3_raw: transformedData.o3_raw,
      o3_corrige: transformedData.o3_corrige,
      no2_voltage_v: transformedData.no2_voltage_v,
      no2_ppb: transformedData.no2_ppb,
      voc_voltage_v: transformedData.voc_voltage_v,
      co_voltage_v: transformedData.co_voltage_v,
      co_ppb: transformedData.co_ppb,
      rawData: body,
    })

    // Mettre à jour le capteur
    await updateDoc(sensorRef, {
      lastSeen: transformedData.timestamp,
      status: await calculateSensorStatus(sensorId),
      isActive: true,
    })

    console.log(`✅ Données traitées et sauvegardées pour le capteur ${sensorData.name} (${sensorId})`)
    return NextResponse.json({ 
      success: true,
      message: "Data received and processed successfully",
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Erreur lors du traitement des données du capteur:", error)
    return NextResponse.json({ error: "Failed to process sensor data" }, { status: 500 })
  }
}

// Fonction pour transformer les données de l'appareil vers le format de la base
function transformSensorData(rawData: any, sensorId: string) {
  try {
    // Validation des champs requis selon le format de l'appareil
    const requiredFields = ['ts', 'PM1', 'PM25', 'PM10', 'O3', 'O3c', 'NO2v', 'NO2', 'VOCv', 'COv', 'CO']
    
    for (const field of requiredFields) {
      if (!(field in rawData)) {
        console.warn(`⚠️ Champ manquant: ${field}`)
        return null
      }
    }

    // Validation des types numériques
    const numericFields = ['ts', 'PM1', 'PM25', 'PM10', 'O3', 'O3c', 'NO2v', 'NO2', 'VOCv', 'COv', 'CO']
    for (const field of numericFields) {
      if (typeof rawData[field] !== 'number' || isNaN(rawData[field])) {
        console.warn(`⚠️ Valeur numérique invalide pour ${field}: ${rawData[field]}`)
        return null
      }
    }

    // Transformer le timestamp - si c'est un nombre, on l'utilise comme millisecondes depuis epoch
    let timestamp: Date
    if (typeof rawData.ts === 'number') {
      // Si le nombre est petit (< 10000000000), c'est probablement en secondes
      const tsValue = rawData.ts < 10000000000 ? rawData.ts * 1000 : rawData.ts
      timestamp = new Date(tsValue)
    } else {
      timestamp = new Date()
    }

    // Si le timestamp n'est pas valide, utiliser l'heure actuelle
    if (isNaN(timestamp.getTime())) {
      timestamp = new Date()
    }

    return {
      sensorId,
      timestamp,
      pm1_0: Number(rawData.PM1),
      pm2_5: Number(rawData.PM25),
      pm10: Number(rawData.PM10),
      o3_raw: Number(rawData.O3),
      o3_corrige: Number(rawData.O3c),
      no2_voltage_v: Number(rawData.NO2v),
      no2_ppb: Number(rawData.NO2),
      voc_voltage_v: Number(rawData.VOCv),
      co_voltage_v: Number(rawData.COv),
      co_ppb: Number(rawData.CO),
    }
  } catch (error) {
    console.error("❌ Erreur lors de la transformation des données:", error)
    return null
  }
}
