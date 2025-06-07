import { PrismaClient, Status } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Début du seeding de la base de données...")

  // Nettoyer les données existantes
  await prisma.sensorData.deleteMany()
  await prisma.sensor.deleteMany()

  console.log("🧹 Données existantes supprimées")

  // Créer des capteurs de test
  const sensors = [
    {
      name: "Capteur Cotonou - Place de l'Étoile Rouge",
      latitude: 6.3703,
      longitude: 2.3912,
      frequency: 15,
      status: Status.GREEN,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      name: "Capteur Cotonou - Marché Dantokpa",
      latitude: 6.3651,
      longitude: 2.433,
      frequency: 10,
      status: Status.GREEN,
      lastSeen: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    },
    {
      name: "Capteur Porto-Novo - Centre-ville",
      latitude: 6.4969,
      longitude: 2.6289,
      frequency: 20,
      status: Status.ORANGE,
      lastSeen: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    },
    {
      name: "Capteur Calavi - Université d'Abomey-Calavi",
      latitude: 6.45,
      longitude: 2.35,
      frequency: 15,
      status: Status.RED,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      name: "Capteur Parakou - Centre administratif",
      latitude: 9.3372,
      longitude: 2.6303,
      frequency: 30,
      status: Status.GREEN,
      lastSeen: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    },
  ]

  console.log("📍 Création des capteurs...")
  const createdSensors = []
  for (const sensorData of sensors) {
    const sensor = await prisma.sensor.create({
      data: sensorData,
    })
    createdSensors.push(sensor)
    console.log(`  ✅ ${sensor.name}`)
  }

  console.log("📊 Génération des données de test...")

  // Générer des données pour les dernières 24 heures
  for (const sensor of createdSensors) {
    const dataPoints = Math.floor((24 * 60) / sensor.frequency) // Points de données pour 24h

    console.log(`  📈 Génération de ${dataPoints} points pour ${sensor.name}`)

    const sensorDataBatch = []
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(Date.now() - i * sensor.frequency * 60 * 1000)

      // Générer des données réalistes avec variations selon le capteur
      const baseValues = getBaseValuesForSensor(sensor.name)
      const timeVariation = getTimeVariation(timestamp)

      sensorDataBatch.push({
        sensorId: sensor.id,
        timestamp,
        pm1_0: addRandomVariation(baseValues.pm1_0, 0.3) * timeVariation,
        pm2_5: addRandomVariation(baseValues.pm2_5, 0.4) * timeVariation,
        pm10: addRandomVariation(baseValues.pm10, 0.5) * timeVariation,
        o3_raw: addRandomVariation(baseValues.o3_raw, 0.2),
        o3_corrige: addRandomVariation(baseValues.o3_corrige, 0.15),
        no2_voltage_mv: addRandomVariation(baseValues.no2_voltage_mv, 0.1),
        no2_ppb: addRandomVariation(baseValues.no2_ppb, 0.3),
        voc_voltage_mv: addRandomVariation(baseValues.voc_voltage_mv, 0.2),
        co_voltage_mv: addRandomVariation(baseValues.co_voltage_mv, 0.25),
        co_ppb: addRandomVariation(baseValues.co_ppb, 0.4),
      })
    }

    // Insérer par batch pour de meilleures performances
    await prisma.sensorData.createMany({
      data: sensorDataBatch,
    })
  }

  // Statistiques finales
  const finalStats = {
    sensors: await prisma.sensor.count(),
    dataPoints: await prisma.sensorData.count(),
    byStatus: await prisma.sensor.groupBy({
      by: ["status"],
      _count: true,
    }),
  }

  console.log("\n🎉 Seeding terminé avec succès!")
  console.log(`📊 Statistiques:`)
  console.log(`  • Capteurs créés: ${finalStats.sensors}`)
  console.log(`  • Points de données: ${finalStats.dataPoints}`)
  finalStats.byStatus.forEach((status) => {
    console.log(`  • ${status.status}: ${status._count} capteurs`)
  })
}

// Fonctions utilitaires pour générer des données réalistes
function getBaseValuesForSensor(sensorName: string) {
  // Valeurs de base selon la localisation
  if (sensorName.includes("Dantokpa")) {
    // Marché = plus de pollution
    return {
      pm1_0: 25,
      pm2_5: 40,
      pm10: 55,
      o3_raw: 25,
      o3_corrige: 23,
      no2_voltage_mv: 1200,
      no2_ppb: 22,
      voc_voltage_mv: 850,
      co_voltage_mv: 1300,
      co_ppb: 0.8,
    }
  } else if (sensorName.includes("Parakou")) {
    // Ville plus petite = moins de pollution
    return {
      pm1_0: 12,
      pm2_5: 20,
      pm10: 28,
      o3_raw: 38,
      o3_corrige: 35,
      no2_voltage_mv: 1000,
      no2_ppb: 15,
      voc_voltage_mv: 650,
      co_voltage_mv: 800,
      co_ppb: 0.3,
    }
  } else {
    // Valeurs moyennes pour les autres
    return {
      pm1_0: 18,
      pm2_5: 30,
      pm10: 42,
      o3_raw: 32,
      o3_corrige: 29,
      no2_voltage_mv: 1150,
      no2_ppb: 19,
      voc_voltage_mv: 750,
      co_voltage_mv: 1000,
      co_ppb: 0.5,
    }
  }
}

function getTimeVariation(timestamp: Date): number {
  const hour = timestamp.getHours()
  // Variation selon l'heure (plus de pollution aux heures de pointe)
  if (hour >= 7 && hour <= 9) return 1.4 // Matin
  if (hour >= 17 && hour <= 19) return 1.3 // Soir
  if (hour >= 22 || hour <= 5) return 0.7 // Nuit
  return 1.0 // Journée normale
}

function addRandomVariation(baseValue: number, variationPercent: number): number {
  const variation = baseValue * variationPercent * (Math.random() - 0.5) * 2
  return Math.max(0, baseValue + variation)
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
