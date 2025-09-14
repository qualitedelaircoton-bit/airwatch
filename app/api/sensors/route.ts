import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import { updateAllSensorStatuses } from "@/lib/firestore-status-calculator"
import { withAuth, withAdminAuth } from "@/lib/api-auth"


export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = 'nodejs'

async function getHandler(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized. Check environment variables.");
    }

    // Mettre à jour les statuts avant de retourner les données
    await updateAllSensorStatuses()

    const snapshot = await adminDb.collection("sensors").get()
    const sensors = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Record<string, any>
      const serializeTsToIso = (value: any): string | null => {
        if (!value) return null
        // Firestore Timestamp object from Admin SDK
        if (typeof value?.toDate === 'function') {
          return value.toDate().toISOString()
        }
        // Support for shapes like { seconds, nanoseconds } or { _seconds, _nanoseconds }
        const seconds = typeof value?.seconds === 'number' ? value.seconds : (typeof value?._seconds === 'number' ? value._seconds : undefined)
        if (typeof seconds === 'number') {
          const date = new Date(seconds * 1000)
          return isNaN(date.getTime()) ? null : date.toISOString()
        }
        // ISO string already
        if (typeof value === 'string') {
          const d = new Date(value)
          return isNaN(d.getTime()) ? null : d.toISOString()
        }
        return null
      }

      return {
        id: docSnap.id,
        ...data,
        // Normalize common date fields
        createdAt: serializeTsToIso((data as any).createdAt),
        updatedAt: serializeTsToIso((data as any).updatedAt),
        lastSeen: serializeTsToIso((data as any).lastSeen),
      }
    })

    return NextResponse.json(sensors, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error("Error fetching sensors:", error)
    return NextResponse.json({ error: "Failed to fetch sensors" }, { status: 500 })
  }
}

async function postHandler(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized. Check environment variables.");
    }

    const body = await request.json();
    const newDocRef = await adminDb.collection("sensors").add({
      name: body.name,
      latitude: body.latitude,
      longitude: body.longitude,
      frequency: body.frequency,
      status: "RED", // Nouveau capteur commence en rouge
      createdAt: Timestamp.now(),
    });

    const newSnap = await newDocRef.get();
    const newData = newSnap.data() as Record<string, any>
    const createdAtIso = typeof newData?.createdAt?.toDate === 'function' ? newData.createdAt.toDate().toISOString() : null
    const newSensor = { id: newDocRef.id, ...newData, createdAt: createdAtIso };
    return NextResponse.json(newSensor, { status: 201 });
  } catch (error) {
    console.error("Error creating sensor:", error);
    return NextResponse.json({ error: "Failed to create sensor" }, { status: 500 });
  }
}

// Export handlers with authentication
export const GET = withAuth(getHandler)
export const POST = withAdminAuth(postHandler)
