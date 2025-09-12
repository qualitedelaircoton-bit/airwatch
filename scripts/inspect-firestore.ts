import { adminDb } from "../lib/firebase-admin";

async function main() {
  if (!adminDb) {
    console.error("❌ Firebase Admin SDK not initialized. Check environment variables.");
    process.exit(1);
  }

  console.log("🔎 Inspecting Firestore sensors and data shapes...\n");
  const sensorsSnap = await adminDb.collection("sensors").get();
  console.log(`Found ${sensorsSnap.size} sensors.`);

  let i = 0;
  for (const doc of sensorsSnap.docs) {
    const data = doc.data() as any;
    const ls = data?.lastSeen;

    const shape = ls == null ? "null" : typeof ls === "string" ? "string" : typeof ls === "object" && typeof (ls as any)?.toDate === "function" ? "admin.Timestamp" : typeof ls;
    const preview = (() => {
      try {
        if (!ls) return null;
        if (typeof (ls as any)?.toDate === "function") return (ls as any).toDate().toISOString();
        if (typeof (ls as any)?.seconds === "number") return new Date(ls.seconds * 1000).toISOString();
        if (typeof (ls as any)?._seconds === "number") return new Date(ls._seconds * 1000).toISOString();
        if (typeof ls === "string") return new Date(ls).toISOString();
        return ls;
      } catch (e) {
        return String(ls);
      }
    })();

    console.log(`\n# Sensor ${++i}: ${doc.id}`);
    console.log(`name: ${data?.name}`);
    console.log(`frequency: ${data?.frequency}`);
    console.log(`status: ${data?.status}`);
    console.log(`lastSeen.shape: ${shape}`);
    console.log(`lastSeen.preview:`, preview);

    // Check latest data point in subcollection 'data'
    try {
      const dataCol = doc.ref.collection("data");
      const latestSnap = await dataCol.orderBy("timestamp", "desc").limit(1).get();
      if (!latestSnap.empty) {
        const d = latestSnap.docs[0].data() as any;
        const ts = d?.timestamp;
        const tsShape = ts == null ? "null" : typeof ts === "string" ? "string" : typeof ts === "object" && typeof (ts as any)?.toDate === "function" ? "admin.Timestamp" : typeof ts;
        const tsPreview = (() => {
          try {
            if (!ts) return null;
            if (typeof (ts as any)?.toDate === "function") return (ts as any).toDate().toISOString();
            if (typeof (ts as any)?.seconds === "number") return new Date(ts.seconds * 1000).toISOString();
            if (typeof (ts as any)?._seconds === "number") return new Date(ts._seconds * 1000).toISOString();
            if (typeof ts === "string") return new Date(ts).toISOString();
            return ts;
          } catch (e) {
            return String(ts);
          }
        })();
        console.log(`latest data id: ${latestSnap.docs[0].id}`);
        console.log(`timestamp.shape: ${tsShape}`);
        console.log(`timestamp.preview:`, tsPreview);
      } else {
        console.log("No data in subcollection 'data'.");
      }
    } catch (e) {
      console.log("Error reading data subcollection:", e);
    }
  }
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
