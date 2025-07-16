import { adminDb } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function getFirestoreStats() {
  if (!adminDb) {
    console.error('❌ Firebase Admin SDK not initialized.');
    process.exit(1);
  }

  console.log('📊 Génération des statistiques de la base de données Firestore...');

  const sensorsRef = adminDb.collection('sensors');
  const sensorsSnapshot = await sensorsRef.get();

  if (sensorsSnapshot.empty) {
    console.log('ℹ️  Aucun capteur trouvé. La base de données est vide.');
    return;
  }

  const totalSensors = sensorsSnapshot.size;
  console.log(`🔍 Analyse de ${totalSensors} capteurs...`);

  const promises = sensorsSnapshot.docs.map(async (sensorDoc) => {
    const sensorData = sensorDoc.data();
    const status = sensorData.status || 'UNKNOWN';

    const sensorDataRef = sensorDoc.ref.collection('sensorData');
    const countSnapshot = await sensorDataRef.count().get();
    const dataCount = countSnapshot.data().count;

    let oldestTs: Timestamp | null = null;
    if (dataCount > 0) {
      const oldestQuery = sensorDataRef.orderBy('timestamp', 'asc').limit(1);
      const oldestSnapshot = await oldestQuery.get();
      if (!oldestSnapshot.empty) {
        oldestTs = oldestSnapshot.docs[0].data().timestamp as Timestamp;
      }
    }

    let newestTs: Timestamp | null = null;
    if (dataCount > 0) {
      const newestQuery = sensorDataRef.orderBy('timestamp', 'desc').limit(1);
      const newestSnapshot = await newestQuery.get();
      if (!newestSnapshot.empty) {
        newestTs = newestSnapshot.docs[0].data().timestamp as Timestamp;
      }
    }

    return { status, dataCount, oldestTs, newestTs };
  });

  const results = await Promise.all(promises);

  const finalStats = results.reduce(
    (acc, result) => {
      acc.sensorsByStatus[result.status] = (acc.sensorsByStatus[result.status] || 0) + 1;
      acc.totalDataPoints += result.dataCount;

      if (result.oldestTs && (!acc.oldestDataPoint || result.oldestTs.toMillis() < acc.oldestDataPoint.toMillis())) {
        acc.oldestDataPoint = result.oldestTs;
      }
      if (result.newestTs && (!acc.newestDataPoint || result.newestTs.toMillis() > acc.newestDataPoint.toMillis())) {
        acc.newestDataPoint = result.newestTs;
      }
      return acc;
    },
    {
      sensorsByStatus: {} as { [key: string]: number },
      totalDataPoints: 0,
      oldestDataPoint: null as Timestamp | null,
      newestDataPoint: null as Timestamp | null,
    }
  );

  console.log('\n--- 📈 Statistiques Firestore ---');
  console.log(`  Capteurs total: ${totalSensors}`);
  console.log('  Statut des capteurs:');
  Object.entries(finalStats.sensorsByStatus).forEach(([status, count]) => {
    console.log(`    - ${status}: ${count}`);
  });
  console.log(`\n  Points de données total: ${finalStats.totalDataPoints}`);
  if (finalStats.oldestDataPoint) {
    console.log(`  Donnée la plus ancienne: ${finalStats.oldestDataPoint.toDate().toLocaleString('fr-FR')}`);
  }
  if (finalStats.newestDataPoint) {
    console.log(`  Donnée la plus récente: ${finalStats.newestDataPoint.toDate().toLocaleString('fr-FR')}`);
  }
  console.log('--------------------------------\n');
}

async function main() {
  try {
    await getFirestoreStats();
  } catch (error) {
    console.error('❌ Une erreur est survenue lors de la génération des statistiques:', error);
    process.exit(1);
  }
}

main();
