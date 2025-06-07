import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
})

async function testConnection() {
  try {
    console.log("🔍 Test de connexion à la base de données Neon...")

    // Test de connexion basique
    await prisma.$connect()
    console.log("✅ Connexion à la base de données réussie!")

    // Test de requête simple
    const sensorCount = await prisma.sensor.count()
    console.log(`📊 Nombre de capteurs dans la base: ${sensorCount}`)

    // Test de requête avec données
    const dataCount = await prisma.sensorData.count()
    console.log(`📈 Nombre de points de données: ${dataCount}`)

    if (sensorCount > 0) {
      // Test de requête complexe avec relations
      const sensorsWithData = await prisma.sensor.findMany({
        include: {
          _count: {
            select: { data: true },
          },
        },
        take: 5,
      })

      console.log("\n📋 Aperçu des capteurs:")
      sensorsWithData.forEach((sensor) => {
        const lastSeenText = sensor.lastSeen
          ? `vu ${Math.round((Date.now() - sensor.lastSeen.getTime()) / (1000 * 60))}min ago`
          : "jamais vu"
        console.log(`  • ${sensor.name}`)
        console.log(`    Status: ${sensor.status} (${lastSeenText})`)
        console.log(`    Données: ${sensor._count.data} points`)
        console.log(`    Fréquence: ${sensor.frequency}min`)
      })

      // Test de performance avec agrégation
      const startTime = Date.now()
      const recentStats = await prisma.sensorData.aggregate({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
          },
        },
        _avg: {
          pm2_5: true,
          pm10: true,
          o3_corrige: true,
        },
        _count: true,
      })
      const endTime = Date.now()

      console.log(`\n⚡ Statistiques des dernières 24h (${endTime - startTime}ms):`)
      console.log(`  • ${recentStats._count} mesures`)
      if (recentStats._avg.pm2_5) {
        console.log(`  • PM2.5 moyen: ${recentStats._avg.pm2_5.toFixed(2)} µg/m³`)
        console.log(`  • PM10 moyen: ${recentStats._avg.pm10?.toFixed(2)} µg/m³`)
        console.log(`  • O3 moyen: ${recentStats._avg.o3_corrige?.toFixed(2)} ppb`)
      }

      // Test des relations
      const sensorWithRecentData = await prisma.sensor.findFirst({
        include: {
          data: {
            orderBy: { timestamp: "desc" },
            take: 3,
          },
        },
      })

      if (sensorWithRecentData?.data.length) {
        console.log(`\n🔗 Test des relations - ${sensorWithRecentData.name}:`)
        sensorWithRecentData.data.forEach((data, index) => {
          console.log(`  ${index + 1}. ${data.timestamp.toLocaleString()} - PM2.5: ${data.pm2_5.toFixed(1)} µg/m³`)
        })
      }
    } else {
      console.log("\n💡 Aucun capteur trouvé. Exécutez 'npm run db:seed' pour ajouter des données de test.")
    }

    // Test de transaction
    console.log("\n🔄 Test de transaction...")
    const transactionResult = await prisma.$transaction(async (tx) => {
      const sensorCount = await tx.sensor.count()
      const dataCount = await tx.sensorData.count()
      return { sensors: sensorCount, data: dataCount }
    })
    console.log(`✅ Transaction réussie: ${transactionResult.sensors} capteurs, ${transactionResult.data} données`)

    console.log("\n🎉 Tous les tests sont passés avec succès!")
    console.log("\n📝 Prochaines étapes:")
    console.log("  • Exécutez 'npm run db:seed' pour ajouter des données de test")
    console.log("  • Exécutez 'npm run db:studio' pour explorer vos données")
    console.log("  • Démarrez l'application avec 'npm run dev'")
  } catch (error) {
    console.error("❌ Erreur lors du test de connexion:")
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`)
      if (error.message.includes("ENOTFOUND") || error.message.includes("connect")) {
        console.error("\n💡 Suggestions:")
        console.error("  • Vérifiez votre variable DATABASE_URL dans .env.local")
        console.error("  • Assurez-vous que votre base Neon est active")
        console.error("  • Vérifiez votre connexion internet")
      }
    } else {
      console.error(error)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testConnection()
