import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import { updateAllSensorStatuses } from "@/lib/firestore-status-calculator"

export async function GET() {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized. Check environment variables.");
    }

    // Mettre à jour les statuts avant de retourner les données
    await updateAllSensorStatuses()

    const snapshot = await adminDb.collection("sensors").get()
    const sensors = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))

    return NextResponse.json(sensors)
  } catch (error) {
    console.error("Error fetching sensors:", error)
    return NextResponse.json({ error: "Failed to fetch sensors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const newSensor = { id: newDocRef.id, ...newSnap.data() };
    return NextResponse.json(newSensor, { status: 201 });
  } catch (error) {
    console.error("Error creating sensor:", error);
    return NextResponse.json({ error: "Failed to create sensor" }, { status: 500 });
  }
}
