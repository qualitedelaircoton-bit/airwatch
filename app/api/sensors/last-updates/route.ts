import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { realtimeService } from "@/lib/realtime-service";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

interface Sensor {
  id: string;
  status: 'GREEN' | 'ORANGE' | 'RED' | 'UNKNOWN';
  [key: string]: any;
}

interface SensorWithLastData extends Sensor {
  lastData: DocumentData | null;
}


export const dynamic = "force-static"

export async function GET() {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized.");
    }

    const sensorsSnapshot = await adminDb!.collection("sensors").get();
    const sensors: Sensor[] = sensorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sensor));

    const lastDataPromises = sensors.map(async (sensor): Promise<SensorWithLastData> => {
      const dataSnapshot = await adminDb!
        .collection(`sensors/${sensor.id}/sensorData`)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
      
      if (dataSnapshot.empty) {
        return { ...sensor, lastData: null };
      }
      
      const firstDoc = dataSnapshot.docs[0];
      if (!firstDoc) {
        // Cette condition ne devrait logiquement jamais être atteinte
        // si dataSnapshot.empty est faux, mais elle satisfait TypeScript.
        return { ...sensor, lastData: null };
      }
      const lastData = firstDoc.data();
      return { ...sensor, lastData };
    });

    const sensorsWithLastData: SensorWithLastData[] = await Promise.all(lastDataPromises);

    const lastWebhookUpdate = realtimeService.getLastWebhookUpdate();

    const latestDataTimestamp = sensorsWithLastData.reduce((latest, sensor) => {
      if (sensor.lastData) {
        const sensorTimestamp = sensor.lastData.timestamp as Timestamp | undefined;
        if (sensorTimestamp && sensorTimestamp.toMillis() > latest) {
          return sensorTimestamp.toMillis();
        }
      }
      return latest;
    }, 0);

    return NextResponse.json({
      lastWebhookUpdate: lastWebhookUpdate?.getTime() || null,
      lastDataUpdate: latestDataTimestamp,
      sensorsCount: sensors.length,
      activeSensors: sensorsWithLastData.filter(s => s.status !== 'RED').length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des dernières mises à jour:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 },
    );
  }
}