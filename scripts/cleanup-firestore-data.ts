/*
 * Firestore cleanup script
 * - Deletes all sensors whose name starts with "coton" (case-insensitive) and their data
 * - For remaining sensors, deletes datapoints where timestamp year == 1900
 * - Deduplicates datapoints with identical timestamps per sensor (keep the first, delete the rest)
 *
 * Usage:
 *   pnpm exec dotenv -e .env.local -- tsx scripts/cleanup-firestore-data.ts --dry-run
 *   pnpm exec dotenv -e .env.local -- tsx scripts/cleanup-firestore-data.ts
 */

import { adminDb } from "../lib/firebase-admin";
import * as admin from "firebase-admin";

const isDryRun = process.argv.includes("--dry-run");

function toDateSafe(v: any): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v?.toDate === 'function') {
    try { return v.toDate() as Date; } catch { return null; }
  }
  if (typeof v?._seconds === 'number') return new Date(v._seconds * 1000);
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'number') {
    const ms = v < 1e11 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function deleteSubcollection(path: string, batchSize = 500) {
  if (!adminDb) throw new Error("Firebase Admin not initialized");
  let deleted = 0;
  while (true) {
    const snap = await adminDb.collection(path).orderBy('__name__').limit(batchSize).get();
    if (snap.empty) break;
    if (!isDryRun) {
      const batch = adminDb.batch();
      for (const doc of snap.docs) batch.delete(doc.ref);
      await batch.commit();
    }
    deleted += snap.size;
    if (snap.size < batchSize) break;
  }
  return deleted;
}

async function deleteSensorAndData(sensorId: string) {
  const subPath = `sensors/${sensorId}/data`;
  const dataDeleted = await deleteSubcollection(subPath, 500);
  if (!isDryRun) {
    await adminDb!.collection('sensors').doc(sensorId).delete();
  }
  return { dataDeleted, sensorDeleted: !isDryRun };
}

async function run() {
  if (!adminDb) {
    console.error('❌ Firebase Admin SDK not initialized.');
    process.exit(1);
  }

  const sensorsSnap = await adminDb.collection('sensors').get();
  let deletedCoton = 0;
  let deleted1900 = 0;
  let dedupDeleted = 0;

  // 1) Delete sensors whose name starts with "coton"
  for (const s of sensorsSnap.docs) {
    const data = s.data() as any;
    const name: string = (data.name || '').toString();
    if (name.toLowerCase().startsWith('coton')) {
      console.log(`🗑️ Deleting sensor '${name}' (${s.id}) and its data...`);
      if (!isDryRun) {
        await deleteSensorAndData(s.id);
      }
      deletedCoton++;
    }
  }

  // Re-fetch sensors after deletion in non-dry-run mode
  const activeSensorsSnap = isDryRun ? sensorsSnap : await adminDb.collection('sensors').get();

  // 2) For remaining sensors: delete datapoints with timestamp year == 1900, and deduplicate same-timestamp points
  for (const s of activeSensorsSnap.docs) {
    const data = s.data() as any;
    const name: string = (data.name || '').toString();
    if (name.toLowerCase().startsWith('coton')) continue; // already handled

    const dataCol = s.ref.collection('data');
    // Process in chunks by ordering on timestamp
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    const seen = new Set<number>(); // seconds since epoch

    while (true) {
      let q = dataCol.orderBy('timestamp', 'asc').limit(1000) as FirebaseFirestore.Query;
      if (lastDoc) q = q.startAfter(lastDoc);
      const snap = await q.get();
      if (snap.empty) break;

      const batch = adminDb.batch();
      let batchOps = 0;

      for (const doc of snap.docs) {
        const d = doc.data() as any;
        const tsDate = toDateSafe(d.timestamp);
        if (!tsDate) continue;

        // A) Delete year == 1900
        if (tsDate.getUTCFullYear() === 1900) {
          if (!isDryRun) batch.delete(doc.ref);
          deleted1900++;
          batchOps++;
          continue; // also don't consider for dedupe
        }

        // B) Deduplicate identical timestamps (to the second)
        const secs = Math.floor(tsDate.getTime() / 1000);
        if (seen.has(secs)) {
          if (!isDryRun) batch.delete(doc.ref);
          dedupDeleted++;
          batchOps++;
        } else {
          seen.add(secs);
        }
      }

      if (!isDryRun && batchOps > 0) {
        await batch.commit();
      }

      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < 1000) break;
    }
  }

  console.log('--- Cleanup Summary ---');
  console.log(`Deleted sensors starting with 'coton': ${deletedCoton}${isDryRun ? ' (dry-run)' : ''}`);
  console.log(`Deleted datapoints with year == 1900: ${deleted1900}${isDryRun ? ' (dry-run)' : ''}`);
  console.log(`Deleted duplicate-timestamp datapoints: ${dedupDeleted}${isDryRun ? ' (dry-run)' : ''}`);
}

run().catch((e) => {
  console.error('❌ Cleanup failed:', e);
  process.exit(1);
});
