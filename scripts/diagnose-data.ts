import { prisma } from '../lib/prisma'

async function diagnoseData() {
  console.log('🔍 Diagnostic des données de capteurs\n')

  try {
    // 1. Lister tous les capteurs
    console.log('📋 Capteurs disponibles:')
    const sensors = await prisma.sensor.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (sensors.length === 0) {
      console.log('❌ Aucun capteur trouvé!')
      return
    }

    sensors.forEach((sensor, i) => {
      console.log(`  ${i + 1}. ${sensor.name} (${sensor.id})`)
      console.log(`     • Statut: ${sensor.status}`)
      console.log(`     • Dernière vue: ${sensor.lastSeen ? new Date(sensor.lastSeen).toLocaleString('fr-FR') : 'Jamais'}`)
      console.log(`     • Fréquence: ${sensor.frequency} minutes`)
      console.log('')
    })

    // 2. Vérifier les données pour chaque capteur
    console.log('📊 Données par capteur:')
    
    for (const sensor of sensors) {
      const dataCount = await prisma.sensorData.count({
        where: { sensorId: sensor.id }
      })
      
      console.log(`\n🔎 ${sensor.name} (${sensor.id}):`)
      console.log(`   • Total données: ${dataCount}`)
      
      if (dataCount > 0) {
        // Dernières données
        const latestData = await prisma.sensorData.findMany({
          where: { sensorId: sensor.id },
          orderBy: { timestamp: 'desc' },
          take: 3
        })
        
        console.log('   • 3 dernières données:')
        latestData.forEach((data, i) => {
          console.log(`     ${i + 1}. ${data.timestamp.toLocaleString('fr-FR')} - PM2.5: ${data.pm2_5}µg/m³`)
          console.log(`        Données brutes: ${data.rawData ? JSON.stringify(data.rawData) : 'Non disponibles'}`)
        })
        
        // Vérifier les timestamps
        const oldestData = await prisma.sensorData.findFirst({
          where: { sensorId: sensor.id },
          orderBy: { timestamp: 'asc' }
        })
        
        if (oldestData) {
          console.log(`   • Première donnée: ${oldestData.timestamp.toLocaleString('fr-FR')}`)
          console.log(`   • Dernière donnée: ${latestData[0].timestamp.toLocaleString('fr-FR')}`)
          
          // Vérifier si les timestamps sont cohérents
          const now = new Date()
          const timeDiff = now.getTime() - latestData[0].timestamp.getTime()
          const hoursDiff = timeDiff / (1000 * 60 * 60)
          
          if (hoursDiff > 24) {
            console.log(`   ⚠️  PROBLÈME: Dernière donnée datée d'il y a ${hoursDiff.toFixed(1)} heures!`)
          } else if (hoursDiff > 1) {
            console.log(`   📅 Dernière donnée: il y a ${hoursDiff.toFixed(1)} heures`)
          } else {
            console.log(`   ✅ Données récentes (il y a ${(hoursDiff * 60).toFixed(0)} minutes)`)
          }
        }
      } else {
        console.log('   ❌ Aucune donnée trouvée!')
      }
    }

    // 3. Vérifier les données des dernières 24h
    console.log('\n📈 Données des dernières 24h:')
    const recentData = await prisma.sensorData.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        sensor: { select: { name: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    if (recentData.length > 0) {
      console.log(`   Total: ${recentData.length} données récentes`)
      recentData.forEach((data, i) => {
        console.log(`   ${i + 1}. ${data.sensor.name}: ${data.timestamp.toLocaleString('fr-FR')} - PM2.5: ${data.pm2_5}µg/m³`)
      })
    } else {
      console.log('   ❌ Aucune donnée récente trouvée!')
    }

    // 4. Test de l'API
    console.log('\n🌐 Test de l\'API:')
    try {
      const response = await fetch('http://localhost:3000/api/sensors')
      if (response.ok) {
        const apiSensors = await response.json()
        console.log(`   ✅ API /api/sensors: ${apiSensors.length} capteurs`)
        
        // Tester l'API des données pour le premier capteur
        if (apiSensors.length > 0) {
          const firstSensor = apiSensors[0]
          const now = new Date()
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          const dataResponse = await fetch(
            `http://localhost:3000/api/sensors/${firstSensor.id}/data?from=${yesterday.toISOString()}&to=${now.toISOString()}`
          )
          
          if (dataResponse.ok) {
            const apiData = await dataResponse.json()
            console.log(`   ✅ API données pour ${firstSensor.name}: ${apiData.length} points`)
          } else {
            console.log(`   ❌ API données échouée: ${dataResponse.status}`)
          }
        }
      } else {
        console.log(`   ❌ API capteurs échouée: ${response.status}`)
      }
    } catch (apiError) {
      console.log('   ❌ Erreur API:', apiError instanceof Error ? apiError.message : 'Erreur inconnue')
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseData().catch(console.error) 