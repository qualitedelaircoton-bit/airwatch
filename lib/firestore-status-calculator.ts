import { db } from "./firebase";
import { doc, getDoc, collection, getDocs, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

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
  const sensorRef = doc(db, "sensors", sensorId);
  const sensorSnap = await getDoc(sensorRef);

  if (!sensorSnap.exists() || !sensorSnap.data().lastSeen) {
    return "RED";
  }

  const sensor = sensorSnap.data() as SensorData;
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
  const sensorsRef = collection(db, "sensors");
  const querySnapshot = await getDocs(sensorsRef);
  const batch = writeBatch(db);
  let updates = 0;

  for (const docSnap of querySnapshot.docs) {
    const sensor = { id: docSnap.id, ...docSnap.data() } as SensorData;
    const newStatus = await calculateSensorStatus(sensor.id);

    if (sensor.status !== newStatus) {
      const sensorRef = doc(db, "sensors", sensor.id);
      batch.update(sensorRef, { status: newStatus });
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
