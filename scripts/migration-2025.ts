import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting migration to 2025 improvements...')

  try {
    // 1. Vérifier la connection à la base de données
    console.log('📊 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // 2. Calculer l'AQI pour les données existantes
    console.log('🔄 Calculating AQI for existing sensor data...')
    const sensorData = await prisma.sensorData.findMany({
      where: {
        aqi: null
      },
      take: 1000 // Traiter par batch pour éviter la surcharge
    })

    for (const data of sensorData) {
      const aqi = calculateAQI(data.pm2_5, data.pm10, data.o3_corrige, data.no2_ppb, data.co_ppb)
      const aqiCategory = getAQICategory(aqi)

      await prisma.sensorData.update({
        where: { id: data.id },
        data: {
          aqi,
          aqiCategory,
          processed: true
        }
      })
    }

    console.log(`✅ Updated AQI for ${sensorData.length} records`)

    // 3. Mettre à jour le statut des capteurs basé sur leurs dernières données
    console.log('🔄 Updating sensor status based on recent data...')
    const sensors = await prisma.sensor.findMany({
      include: {
        data: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    for (const sensor of sensors) {
      if (sensor.data.length > 0) {
        const latestData = sensor.data[0]
        if (latestData) {
          const status = getSensorStatus(latestData.aqi || 0)
          const isActive = isRecentData(latestData.timestamp)

          await prisma.sensor.update({
            where: { id: sensor.id },
            data: {
              status,
              isActive,
              lastSeen: latestData.timestamp
            }
          })
        }
      }
    }

    console.log(`✅ Updated status for ${sensors.length} sensors`)

    // 4. Créer des alertes pour les valeurs critiques
    console.log('🚨 Creating alerts for critical values...')
    const criticalData = await prisma.sensorData.findMany({
      where: {
        OR: [
          { pm2_5: { gte: 55.5 } }, // Unhealthy level
          { pm10: { gte: 155 } },
          { o3_corrige: { gte: 165 } },
          { no2_ppb: { gte: 100 } },
          { co_ppb: { gte: 15400 } }
        ],
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: { sensor: true }
    })

    for (const data of criticalData) {
      // Check if alert already exists for this sensor and time period
      const existingAlert = await prisma.alert.findFirst({
        where: {
          sensorId: data.sensorId,
          createdAt: {
            gte: new Date(data.timestamp.getTime() - 60 * 60 * 1000) // Within 1 hour
          },
          isResolved: false
        }
      })

      if (!existingAlert) {
        let alertType: any = 'DATA_ANOMALY'
        let threshold = 0
        let actualValue = 0
        let message = ''

        if (data.pm2_5 >= 55.5) {
          alertType = 'PM25_HIGH'
          threshold = 55.5
          actualValue = data.pm2_5
          message = `PM2.5 level is critically high: ${data.pm2_5.toFixed(1)} µg/m³`
        } else if (data.pm10 >= 155) {
          alertType = 'PM10_HIGH'
          threshold = 155
          actualValue = data.pm10
          message = `PM10 level is critically high: ${data.pm10.toFixed(1)} µg/m³`
        }
        // Add more conditions as needed...

        await prisma.alert.create({
          data: {
            sensorId: data.sensorId,
            type: alertType,
            severity: 'CRITICAL',
            message,
            threshold,
            actualValue
          }
        })
      }
    }

    console.log(`✅ Created/checked alerts for ${criticalData.length} critical readings`)

    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour calculer l'AQI (Air Quality Index)
function calculateAQI(pm25: number, pm10: number, o3: number, no2: number, co: number): number {
  // Simplified AQI calculation - in production, use official EPA formula
  const pm25AQI = (pm25 / 35.4) * 100 // Rough approximation
  const pm10AQI = (pm10 / 154) * 100
  const o3AQI = (o3 / 164) * 100
  const no2AQI = (no2 / 100) * 100
  const coAQI = (co / 15400) * 100

  return Math.round(Math.max(pm25AQI, pm10AQI, o3AQI, no2AQI, coAQI))
}

// Fonction pour déterminer la catégorie AQI
function getAQICategory(aqi: number): any {
  if (aqi <= 50) return 'GOOD'
  if (aqi <= 100) return 'MODERATE'
  if (aqi <= 150) return 'UNHEALTHY_SENSITIVE'
  if (aqi <= 200) return 'UNHEALTHY'
  if (aqi <= 300) return 'VERY_UNHEALTHY'
  return 'HAZARDOUS'
}

// Fonction pour déterminer le statut du capteur
function getSensorStatus(aqi: number): any {
  if (aqi <= 100) return 'GREEN'
  if (aqi <= 200) return 'ORANGE'
  return 'RED'
}

// Fonction pour vérifier si les données sont récentes
function isRecentData(timestamp: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hoursDiff = diff / (1000 * 60 * 60)
  return hoursDiff <= 2 // Consider active if data is less than 2 hours old
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 