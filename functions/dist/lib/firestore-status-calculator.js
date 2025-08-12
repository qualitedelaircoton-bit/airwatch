"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSensorStatus = calculateSensorStatus;
exports.updateAllSensorStatuses = updateAllSensorStatuses;
const admin = require("firebase-admin");
/**
 * Calcule le statut d'un capteur en fonction de sa dernière communication.
 * @param sensorId L'ID du capteur.
 * @returns Le nouveau statut du capteur.
 */
async function calculateSensorStatus(sensorId) {
    const adminDb = admin.firestore();
    const sensorRef = adminDb.collection("sensors").doc(sensorId);
    const sensorSnap = await sensorRef.get();
    const sensorData = sensorSnap.data();
    if (!sensorSnap.exists || !sensorData?.lastSeen) {
        return "RED";
    }
    const sensor = sensorData;
    const now = new Date();
    const lastSeenTime = sensor.lastSeen.toDate();
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
async function updateAllSensorStatuses() {
    const adminDb = admin.firestore();
    const sensorsRef = adminDb.collection("sensors");
    const querySnapshot = await sensorsRef.get();
    const batch = adminDb.batch();
    let updates = 0;
    for (const docSnap of querySnapshot.docs) {
        const sensor = { id: docSnap.id, ...docSnap.data() };
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
    }
    else {
        console.log("ℹ️ Aucun statut de capteur à mettre à jour.");
    }
}
//# sourceMappingURL=firestore-status-calculator.js.map