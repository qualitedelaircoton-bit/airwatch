/*
 * Backfill lastSeen for sensors based on latest data timestamp,
 * then recalculate sensor statuses.
 *
 * Usage:
 *   pnpm exec dotenv -e .env.local -- tsx scripts/backfill-last-seen.ts
 */

import { adminDb } from "../lib/firebase-admin";
import * as admin from "firebase-admin";
import { updateAllSensorStatuses } from "../lib/firestore-status-calculator";

function toDateSafe(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof (v as any)?.toDate === 'function') {
    try { return (v as any).toDate() as Date; } catch { return null; }
  }
  if (typeof (v as any)?._seconds === 'number') {
    const seconds = (v as any)._seconds as number;
    return new Date(seconds * 1000);
  }
  if (typeof (v as any)?.seconds === 'number') {
    const seconds = (v as any).seconds as number;
    return new Date(seconds * 1000);
  }
  if (typeof v === 'number') {
    const ms = v < 1e11 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function main() {
  if (!adminDb) {
    console.error("❌ Firebase Admin SDK not initialized.");
    process.exit(1);
  }

  console.log("🔧 Backfilling lastSeen from latest data points...");
  const sensorsSnap = await adminDb.collection('sensors').get();
  let updated = 0;

  for (const doc of sensorsSnap.docs) {
    const sensorId = doc.id;
    const sensor = doc.data() as Record<string, any>;

    const dataCol = doc.ref.collection('data');
    const latestSnap = await dataCol.orderBy('timestamp', 'desc').limit(1).get();
    if (latestSnap.empty) continue;

    const latest = latestSnap.docs[0]!.data();
    const tsDate = toDateSafe(latest.timestamp);
    if (!tsDate) continue;

    const curLastSeen = toDateSafe(sensor.lastSeen);
    if (!curLastSeen || tsDate.getTime() > curLastSeen.getTime()) {
      await doc.ref.update({ lastSeen: admin.firestore.Timestamp.fromDate(tsDate), isActive: true });
      updated++;
    }
  }

  console.log(`✅ lastSeen updated on ${updated} sensors. Recomputing statuses...`);
  await updateAllSensorStatuses();
  console.log("✅ Sensor statuses recomputed.");
}

main().catch((e) => {
  console.error("❌ Backfill failed:", e);
  process.exit(1);
});
