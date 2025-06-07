import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class DatabaseUtils {
  // Nettoyer les anciennes données
  static async cleanOldData(daysToKeep = 30) {
    console.log(`🧹 Nettoyage des données de plus de ${daysToKeep} jours...`)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const deletedCount = await prisma.sensorData.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`✅ ${deletedCount.count} enregistrements supprimés`)
    return deletedCount.count
  }

  // Statistiques de la base de données
  static async getDatabaseStats() {
    console.log("📊 Génération des statistiques de la base de données...")

    const stats = {
      sensors: {
        total: await prisma.sensor.count(),
        byStatus: await prisma.sensor.groupBy({
          by: ["status"],
          _count: true,
        }),
        withData: await prisma.sensor.count({
          where: {
            data: {
              some: {},
            },
          },
        }),
      },
      data: {
        total: await prisma.sensorData.count(),
        last24h: await prisma.sensorData.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        lastWeek: await prisma.sensorData.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        oldest: await prisma.sensorData.findFirst({
          orderBy: { timestamp: "asc" },
          select: { timestamp: true },
        }),
        newest: await prisma.sensorData.findFirst({
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        }),
      },
    }

    console.log("\n📈 Statistiques:")
    console.log(`  Capteurs total: ${stats.sensors.total}`)
    console.log(`  Capteurs avec données: ${stats.sensors.withData}`)
    stats.sensors.byStatus.forEach((status) => {
      console.log(`    ${status.status}: ${status._count}`)
    })
    console.log(`  Données total: ${stats.data.total}`)
    console.log(`  Données 24h: ${stats.data.last24h}`)
    console.log(`  Données 7j: ${stats.data.lastWeek}`)
    if (stats.data.oldest) {
      console.log(`  Plus ancienne: ${stats.data.oldest.timestamp.toLocaleString()}`)
    }
    if (stats.data.newest) {
      console.log(`  Plus récente: ${stats.data.newest.timestamp.toLocaleString()}`)
    }

    return stats
  }

  // Vérifier l'intégrité des données
  static async checkDataIntegrity() {
    console.log("🔍 Vérification de l'intégrité des données...")

    // Vérifier les capteurs sans données
    const sensorsWithoutData = await prisma.sensor.findMany({
      where: {
        data: {
          none: {},
        },
      },
      select: { id: true, name: true, createdAt: true },
    })

    // Vérifier les données avec des valeurs aberrantes
    const suspiciousData = await prisma.sensorData.findMany({
      where: {
        OR: [
          { pm2_5: { gt: 500 } }, // PM2.5 > 500 µg/m³ (très élevé)
          { pm10: { gt: 1000 } }, // PM10 > 1000 µg/m³ (très élevé)
          { pm1_0: { lt: 0 } }, // Valeurs négatives
          { pm2_5: { lt: 0 } },
          { pm10: { lt: 0 } },
        ],
      },
      select: { id: true, sensorId: true, timestamp: true, pm1_0: true, pm2_5: true, pm10: true },
      take: 10,
    })

    // Vérifier la cohérence des données (PM1.0 <= PM2.5 <= PM10)
    // Note: Les comparaisons directes entre champs nécessitent une requête SQL brute
    // Pour l'instant, nous récupérons un échantillon et vérifions manuellement
    const sampleData = await prisma.sensorData.findMany({
      where: {
        // Récupérer des données qui ont des valeurs pour ces champs
        pm1_0: { gte: 0 },
        pm2_5: { gte: 0 },
        pm10: { gte: 0 },
      },
      select: { id: true, sensorId: true, pm1_0: true, pm2_5: true, pm10: true },
      take: 100,
    })

    const inconsistentData = sampleData.filter(data => 
      data.pm1_0 > data.pm2_5 || data.pm2_5 > data.pm10
    )

    console.log(`📊 Capteurs sans données: ${sensorsWithoutData.length}`)
    console.log(`📊 Données suspectes: ${suspiciousData.length}`)
    console.log(`📊 Données incohérentes: ${inconsistentData.length}`)

    if (sensorsWithoutData.length > 0) {
      console.log("  Capteurs sans données:")
      sensorsWithoutData.forEach((sensor) => {
        console.log(`    • ${sensor.name} (créé le ${sensor.createdAt.toLocaleDateString()})`)
      })
    }

    if (suspiciousData.length > 0) {
      console.log("  Données suspectes (échantillon):")
      suspiciousData.slice(0, 5).forEach((data) => {
        console.log(`    • ${data.id}: PM1.0=${data.pm1_0}, PM2.5=${data.pm2_5}, PM10=${data.pm10}`)
      })
    }

    return {
      sensorsWithoutData: sensorsWithoutData.length,
      suspiciousData: suspiciousData.length,
      inconsistentData: inconsistentData.length,
    }
  }

  // Calculer des moyennes par capteur
  static async getSensorAverages(hours = 24) {
    console.log(`📊 Calcul des moyennes sur ${hours}h...`)

    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const averages = await prisma.sensor.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        data: {
          where: {
            timestamp: { gte: since },
          },
          select: {
            pm1_0: true,
            pm2_5: true,
            pm10: true,
            o3_corrige: true,
            no2_ppb: true,
            co_ppb: true,
          },
        },
      },
    })

    const results = averages.map((sensor) => {
      if (sensor.data.length === 0) {
        return {
          sensor: sensor.name,
          status: sensor.status,
          dataPoints: 0,
          averages: null,
        }
      }

      const avg = {
        pm1_0: sensor.data.reduce((sum, d) => sum + d.pm1_0, 0) / sensor.data.length,
        pm2_5: sensor.data.reduce((sum, d) => sum + d.pm2_5, 0) / sensor.data.length,
        pm10: sensor.data.reduce((sum, d) => sum + d.pm10, 0) / sensor.data.length,
        o3_corrige: sensor.data.reduce((sum, d) => sum + d.o3_corrige, 0) / sensor.data.length,
        no2_ppb: sensor.data.reduce((sum, d) => sum + d.no2_ppb, 0) / sensor.data.length,
        co_ppb: sensor.data.reduce((sum, d) => sum + d.co_ppb, 0) / sensor.data.length,
      }

      return {
        sensor: sensor.name,
        status: sensor.status,
        dataPoints: sensor.data.length,
        averages: {
          pm1_0: Math.round(avg.pm1_0 * 100) / 100,
          pm2_5: Math.round(avg.pm2_5 * 100) / 100,
          pm10: Math.round(avg.pm10 * 100) / 100,
          o3_corrige: Math.round(avg.o3_corrige * 100) / 100,
          no2_ppb: Math.round(avg.no2_ppb * 100) / 100,
          co_ppb: Math.round(avg.co_ppb * 100) / 100,
        },
      }
    })

    console.log("\n📊 Moyennes par capteur:")
    results.forEach((result) => {
      console.log(`\n  ${result.sensor} (${result.status})`)
      console.log(`    Points de données: ${result.dataPoints}`)
      if (result.averages) {
        console.log(`    PM2.5: ${result.averages.pm2_5} µg/m³`)
        console.log(`    PM10: ${result.averages.pm10} µg/m³`)
        console.log(`    O3: ${result.averages.o3_corrige} ppb`)
        console.log(`    NO2: ${result.averages.no2_ppb} ppb`)
        console.log(`    CO: ${result.averages.co_ppb} ppb`)
      }
    })

    return results
  }

  // Reset complet de la base de données
  static async resetDatabase() {
    console.log("🔄 Reset complet de la base de données...")

    const deletedData = await prisma.sensorData.deleteMany()
    const deletedSensors = await prisma.sensor.deleteMany()

    console.log(`✅ ${deletedData.count} points de données supprimés`)
    console.log(`✅ ${deletedSensors.count} capteurs supprimés`)

    return { deletedData: deletedData.count, deletedSensors: deletedSensors.count }
  }
}

// CLI pour exécuter les utilitaires
async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case "clean":
        const days = Number.parseInt(process.argv[3] || "30") || 30
        await DatabaseUtils.cleanOldData(days)
        break

      case "stats":
        await DatabaseUtils.getDatabaseStats()
        break

      case "check":
        await DatabaseUtils.checkDataIntegrity()
        break

      case "averages":
        const hours = Number.parseInt(process.argv[3] || "24") || 24
        await DatabaseUtils.getSensorAverages(hours)
        break

      case "reset":
        console.log("⚠️  ATTENTION: Cette action va supprimer TOUTES les données!")
        console.log("Tapez 'yes' pour confirmer:")
        const readline = require("readline")
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        })

        rl.question("Confirmer (yes/no): ", async (answer: string) => {
          if (answer.toLowerCase() === "yes") {
            await DatabaseUtils.resetDatabase()
            console.log("✅ Base de données réinitialisée")
          } else {
            console.log("❌ Opération annulée")
          }
          rl.close()
        })
        return

      default:
        console.log("Usage: npx ts-node scripts/database-utils.ts <command>")
        console.log("Commands:")
        console.log("  clean [days]     - Nettoyer les données anciennes (défaut: 30 jours)")
        console.log("  stats            - Afficher les statistiques")
        console.log("  check            - Vérifier l'intégrité des données")
        console.log("  averages [hours] - Calculer les moyennes (défaut: 24h)")
        console.log("  reset            - Reset complet de la DB (DANGER!)")
    }
  } catch (error) {
    console.error("❌ Erreur:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
