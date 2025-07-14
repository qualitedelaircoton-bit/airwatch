// scripts/migrate-prisma-to-firestore.ts

import { PrismaClient } from '@prisma/client'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import 'dotenv/config'

// 1. Initialisation de Prisma
const prisma = new PrismaClient()

// 2. Initialisation de Firebase Admin
// Assurez-vous que les variables d'environnement sont bien chargées
if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Les variables d\'environnement Firebase Admin ne sont pas définies.')
}

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

async function main() {
  console.log('🚀 Démarrage de la migration de Prisma (PostgreSQL) vers Firestore...')

  try {
    // 3. Récupérer tous les capteurs de Prisma
    const sensorsFromPrisma = await prisma.sensor.findMany({
      include: {
        data: true, // Inclure les données de capteurs associées
        alerts: true, // Inclure les alertes associées
      },
    })

    if (sensorsFromPrisma.length === 0) {
      console.log('Aucun capteur trouvé dans la base de données Prisma. Migration terminée.')
      return
    }

    console.log(`✅ ${sensorsFromPrisma.length} capteurs trouvés. Début du traitement...`)

    // 4. Traiter chaque capteur pour la migration
    for (const sensor of sensorsFromPrisma) {
      const { id, data, alerts, ...sensorData } = sensor

      // Création d'un batch Firestore pour l'atomicité
      const batch = db.batch()

      // Préparation des données du capteur pour Firestore
      const sensorDocRef = db.collection('sensors').doc(id)
      const firestoreSensorData = {
        ...sensorData,
        // Conversion des dates en Timestamps Firestore
        lastSeen: sensor.lastSeen ? Timestamp.fromDate(new Date(sensor.lastSeen)) : null,
        createdAt: Timestamp.fromDate(new Date(sensor.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sensor.updatedAt)),
      }
      batch.set(sensorDocRef, firestoreSensorData)

      // Migration des données de capteur (SensorData)
      if (data && data.length > 0) {
        data.forEach(d => {
          const { id: dataId, sensorId, ...sensorSubData } = d
          const dataDocRef = sensorDocRef.collection('sensorData').doc(dataId)
          batch.set(dataDocRef, {
            ...sensorSubData,
            timestamp: Timestamp.fromDate(new Date(d.timestamp)),
          })
        })
      }

      // Migration des alertes (Alerts)
      if (alerts && alerts.length > 0) {
        alerts.forEach(a => {
          const { id: alertId, sensorId, ...alertSubData } = a
          const alertDocRef = sensorDocRef.collection('alerts').doc(alertId)
          batch.set(alertDocRef, {
            ...alertSubData,
            resolvedAt: a.resolvedAt ? Timestamp.fromDate(new Date(a.resolvedAt)) : null,
            createdAt: Timestamp.fromDate(new Date(a.createdAt)),
            updatedAt: Timestamp.fromDate(new Date(a.updatedAt)),
          })
        })
      }

      // Exécution du batch
      await batch.commit()
      console.log(`  -> Capteur ${sensor.name} (ID: ${id}) et ses ${data.length} points de données, ${alerts.length} alertes ont été migrés.`)
    }

    console.log('🎉 Migration terminée avec succès !')

  } catch (error) {
    console.error('❌ Une erreur est survenue durant la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
