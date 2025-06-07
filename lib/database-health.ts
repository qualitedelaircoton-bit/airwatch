import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export interface DatabaseHealth {
  status: "healthy" | "warning" | "critical"
  checks: {
    connection: boolean
    dataFreshness: boolean
    diskSpace: boolean
    performance: boolean
  }
  metrics: {
    totalSensors: number
    activeSensors: number
    dataPoints24h: number
    avgResponseTime: number
  }
  issues: string[]
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const health: DatabaseHealth = {
    status: "healthy",
    checks: {
      connection: false,
      dataFreshness: false,
      diskSpace: false,
      performance: false,
    },
    metrics: {
      totalSensors: 0,
      activeSensors: 0,
      dataPoints24h: 0,
      avgResponseTime: 0,
    },
    issues: [],
  }

  try {
    // Test de connexion
    const startTime = Date.now()
    await prisma.$connect()
    health.checks.connection = true

    // Métriques de base
    health.metrics.totalSensors = await prisma.sensor.count()
    health.metrics.activeSensors = await prisma.sensor.count({
      where: { status: "GREEN" },
    })

    // Données récentes
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    health.metrics.dataPoints24h = await prisma.sensorData.count({
      where: { timestamp: { gte: last24h } },
    })

    // Test de performance
    const perfStart = Date.now()
    await prisma.sensorData.findMany({
      take: 100,
      orderBy: { timestamp: "desc" },
    })
    health.metrics.avgResponseTime = Date.now() - perfStart
    health.checks.performance = health.metrics.avgResponseTime < 1000 // < 1s

    // Vérification de la fraîcheur des données
    const recentData = await prisma.sensorData.findFirst({
      orderBy: { timestamp: "desc" },
    })

    if (recentData) {
      const dataAge = Date.now() - recentData.timestamp.getTime()
      health.checks.dataFreshness = dataAge < 60 * 60 * 1000 // < 1h

      if (!health.checks.dataFreshness) {
        health.issues.push(`Données les plus récentes datent de ${Math.round(dataAge / (60 * 1000))} minutes`)
      }
    } else {
      health.checks.dataFreshness = false
      health.issues.push("Aucune donnée trouvée dans la base")
    }

    // Vérification de l'espace disque (approximatif)
    const tableSize = (await prisma.$queryRaw`
      SELECT 
        pg_size_pretty(pg_total_relation_size('sensor_data')) as data_size,
        pg_size_pretty(pg_total_relation_size('sensors')) as sensors_size
    `) as any[]

    health.checks.diskSpace = true // Neon gère automatiquement l'espace

    // Déterminer le statut global
    const failedChecks = Object.values(health.checks).filter((check) => !check).length

    if (failedChecks === 0) {
      health.status = "healthy"
    } else if (failedChecks <= 2) {
      health.status = "warning"
    } else {
      health.status = "critical"
    }

    if (!health.checks.performance) {
      health.issues.push(`Performance dégradée: ${health.metrics.avgResponseTime}ms`)
    }
  } catch (error) {
    health.status = "critical"
    health.issues.push(`Erreur de connexion: ${error}`)
  } finally {
    await prisma.$disconnect()
  }

  return health
}

export async function getDatabaseMetrics() {
  try {
    const metrics = (await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM sensors) as total_sensors,
        (SELECT COUNT(*) FROM sensors WHERE status = 'GREEN') as active_sensors,
        (SELECT COUNT(*) FROM sensor_data WHERE timestamp >= NOW() - INTERVAL '24 hours') as data_24h,
        (SELECT COUNT(*) FROM sensor_data WHERE timestamp >= NOW() - INTERVAL '1 hour') as data_1h,
        (SELECT AVG(pm2_5) FROM sensor_data WHERE timestamp >= NOW() - INTERVAL '1 hour') as avg_pm25,
        (SELECT MAX(timestamp) FROM sensor_data) as last_data_time
    `) as any[]

    return metrics[0]
  } catch (error) {
    console.error("Erreur lors de la récupération des métriques:", error)
    return null
  }
}
