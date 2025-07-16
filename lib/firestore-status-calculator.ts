import { adminDb } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Remplacement de l'enum Prisma
export type Status = "GREEN" | "ORANGE" | "RED";

// Interface pour les données du capteur depuis Firestore
interface SensorData {
  id: string;
  lastSeen?: Timestamp;
  frequency: number;
  status: Status;
}

/**
 * Calcule le statut d'un capteur en fonction de sa dernière communication.
 * @param sensorId L'ID du capteur.
 * @returns Le nouveau statut du capteur.
 */
export async function calculateSensorStatus(sensorId: string): Promise<Status> {
  if (!adminDb) {
    throw new Error("Firebase Admin SDK not initialized. Check environment variables.");
  }
  const sensorRef = adminDb.collection("sensors").doc(sensorId);
  const sensorSnap = await sensorRef.get();

  const sensorData = sensorSnap.data();

  if (!sensorSnap.exists || !sensorData?.lastSeen) {
    return "RED";
  }

  const sensor = sensorData as SensorData;
  const now = new Date();
  const lastSeenTime = sensor.lastSeen!.toDate();
  const timeDifferenceMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60);

  // Rouge : hors ligne après une journée (1440 minutes)
  if (timeDifferenceMinutes >= 1440) {
    return "RED";
  }

  // Orange : en retard après 4 manques de données (4 x fréquence)
  if (timeDifferenceMinutes > sensor.frequency * 4) {
    return "ORANGE";
  }

  // Vert : dans les temps
  return "GREEN";
}

/**
 * Met à jour le statut de tous les capteurs de la base de données.
 */
export async function updateAllSensorStatuses() {
  if (!adminDb) {
    throw new Error("Firebase Admin SDK not initialized. Check environment variables.");
  }
  const sensorsRef = adminDb.collection("sensors");
  const querySnapshot = await sensorsRef.get();
  const batch = adminDb.batch();
  let updates = 0;

  for (const docSnap of querySnapshot.docs) {
    const sensor = { id: docSnap.id, ...docSnap.data() } as SensorData;
    const newStatus = await calculateSensorStatus(sensor.id);

    if (sensor.status !== newStatus) {
      const sensorDocRef = adminDb.collection("sensors").doc(sensor.id);
      batch.update(sensorDocRef, { status: newStatus });
      updates++;
    }
  }

  if (updates > 0) {
    await batch.commit();
    console.log(`✅ ${updates} statuts de capteurs mis à jour.`);
  } else {
    console.log("ℹ️ Aucun statut de capteur à mettre à jour.");
  }
}
