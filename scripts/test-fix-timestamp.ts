import mqtt from 'mqtt'
import { startMQTTListener, stopMQTTListener } from '../lib/mqtt-listener'
import { prisma } from '../lib/prisma'

const SENSOR_ID = 'cmc51ivh10005u8gsbygy87lw'  // cotonou1
const brokerHost = process.env.MQTT_BROKER_HOST || '34.38.83.146'
const port = 1883

async function testTimestampFix() {
  console.log('🧪 Test de la correction du timestamp...\n')

  // 1. Démarrer le MQTT Listener avec la correction
  console.log('📋 Démarrage du MQTT Listener corrigé')
  const mqttListener = startMQTTListener()
  
  // Attendre que la connexion s'établisse
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 2. Envoyer des données au format de l'appareil avec timestamp relatif
  console.log('\n📋 Envoi des données avec timestamp relatif')
  const brokerUrl = `mqtt://${brokerHost}:${port}`
  
  const client = mqtt.connect(brokerUrl, {
    protocol: "mqtt" as const,
    clientId: `timestamp-test-${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 10000,
    keepalive: 60,
    protocolVersion: 4,
  })

  await new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('✅ Client de test connecté')
      
      // Données exactement comme votre appareil les envoie
      const deviceData = {
        "ts": 49,  // Timestamp relatif petit
        "PM1": 12,
        "PM25": 17,
        "PM10": 20,
        "O3": 56,
        "O3c": 26,
        "NO2v": 0.01,
        "NO2": 0,
        "VOCv": 0.12,
        "COv": 0.41,
        "CO": 0
      }

      const topic = `sensors/${SENSOR_ID}/data`
      console.log(`📤 Envoi vers: ${topic}`)
      console.log('📊 Données:', JSON.stringify(deviceData, null, 2))

      client.publish(topic, JSON.stringify(deviceData), { qos: 1 }, (error) => {
        if (error) {
          console.error('❌ Erreur envoi:', error)
          reject(error)
        } else {
          console.log('✅ Données envoyées!')
          client.end()
          resolve(undefined)
        }
      })
    })

    client.on('error', reject)
  })

  // 3. Attendre le traitement
  console.log('\n📋 Attente du traitement...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 4. Vérifier les nouvelles données avec timestamp correct
  console.log('\n📋 Vérification des résultats:')
  
  const now = new Date()
  const recentData = await prisma.sensorData.findMany({
    where: {
      sensorId: SENSOR_ID,
      timestamp: {
        gte: new Date(now.getTime() - 10 * 60 * 1000) // Dernières 10 minutes
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 1
  })
  
  if (recentData.length > 0) {
    const data = recentData[0]
    console.log('🎉 SUCCÈS! Données avec timestamp correct:')
    console.log(`   • Timestamp: ${data.timestamp.toLocaleString('fr-FR')}`)
    console.log(`   • PM2.5: ${data.pm2_5}µg/m³`)
    console.log(`   • Données brutes: ${data.rawData ? JSON.stringify(data.rawData) : 'N/A'}`)
    
    const timeDiff = now.getTime() - data.timestamp.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    console.log(`   • Âge des données: ${minutesDiff.toFixed(1)} minutes`)
    
  } else {
    console.log('❌ Aucune donnée récente trouvée')
  }

  // 5. Tester l'API avec les nouvelles données
  console.log('\n🌐 Test API avec données récentes:')
  try {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const response = await fetch(
      `http://localhost:3000/api/sensors/${SENSOR_ID}/data?from=${yesterday.toISOString()}&to=${now.toISOString()}`
    )
    
    if (response.ok) {
      const apiData = await response.json()
      console.log(`   ✅ API trouve maintenant: ${apiData.length} points récents`)
      
      if (apiData.length > 0) {
        console.log('   📊 Dernière donnée API:')
        const lastData = apiData[apiData.length - 1]
        console.log(`      • Timestamp: ${new Date(lastData.timestamp).toLocaleString('fr-FR')}`)
        console.log(`      • PM2.5: ${lastData.pm2_5}µg/m³`)
      }
    } else {
      console.log(`   ❌ API échouée: ${response.status}`)
    }
  } catch (apiError) {
    console.log('   ❌ Erreur API:', apiError instanceof Error ? apiError.message : 'Erreur inconnue')
  }

  // 6. Nettoyer
  console.log('\n📋 Nettoyage')
  await stopMQTTListener()
  await prisma.$disconnect()
  
  console.log('✅ Test de correction terminé!')
  console.log('\n💡 Si le test est réussi, votre interface web devrait maintenant afficher les données!')
}

testTimestampFix().catch(console.error) 