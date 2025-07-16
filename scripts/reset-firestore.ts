import { adminDb } from '../lib/firebase-admin';
import * as readline from 'readline';

// Fonction pour supprimer une collection par lots
async function deleteCollection(collectionPath: string, batchSize: number) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  const collectionRef = adminDb.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
  resolve: () => void,
  reject: (error: any) => void,
) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    // Plus rien à supprimer
    resolve();
    return;
  }

  // Supprimer les documents par lot
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Répéter le processus
  process.nextTick(() => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function resetFirestore() {
  if (!adminDb) {
    console.error('❌ Firebase Admin SDK not initialized.');
    return;
  }

  console.log('🔥 Récupération de tous les capteurs...');
  const sensorsSnapshot = await adminDb.collection('sensors').get();

  if (sensorsSnapshot.empty) {
    console.log('✅ La base de données est déjà vide. Aucune action requise.');
    return;
  }

  console.log(`🗑️  Trouvé ${sensorsSnapshot.size} capteurs à supprimer.`);

  for (const sensorDoc of sensorsSnapshot.docs) {
    console.log(`  - Suppression des données pour le capteur ${sensorDoc.id}...`);
    const subcollectionPath = `sensors/${sensorDoc.id}/sensorData`;
    await deleteCollection(subcollectionPath, 50);
    console.log(`    ...données de ${sensorDoc.id} supprimées.`);
    
    // Supprimer le document du capteur lui-même
    await sensorDoc.ref.delete();
    console.log(`  - Document du capteur ${sensorDoc.id} supprimé.`);
  }

  console.log('✅ Réinitialisation de la base de données Firestore terminée.');
}

function askForConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('⚠️  ATTENTION: Cette action va supprimer TOUTES les données des capteurs dans Firestore!');
  console.log('Cette action est IRRÉVERSIBLE.');
  rl.question("Pour confirmer, tapez 'reset firestore': ", async (answer) => {
    if (answer === 'reset firestore') {
      try {
        await resetFirestore();
      } catch (error) {
        console.error('❌ Une erreur est survenue lors de la réinitialisation:', error);
      }
    } else {
      console.log('❌ Opération annulée.');
    }
    rl.close();
  });
}

// Exécuter le script
askForConfirmation();
