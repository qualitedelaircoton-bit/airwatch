import mqtt from 'mqtt'
import { startMQTTListener, stopMQTTListener } from '../lib/mqtt-listener'
import { prisma } from '../lib/prisma'

const SENSOR_ID = 'cmc4xq76l0001u808bvwm7xo5'
const brokerHost = process.env.MQTT_BROKER_HOST || '34.38.83.146'
const port = 1883

async function finalTest() {
  console.log('🧪 Test final complet MQTT + Base de données\n')

  // 1. Vérifier le capteur
  console.log('📋 Étape 1: Vérification du capteur')
  const sensor = await prisma.sensor.findUnique({
    where: { id: SENSOR_ID }
  })
  
  if (!sensor) {
    console.error('❌ Capteur introuvable!')
    process.exit(1)
  }
  
  console.log(`✅ Capteur trouvé: ${sensor.name} (${sensor.status})`)

  // 2. Compter les données existantes
  const initialDataCount = await prisma.sensorData.count({
    where: { sensorId: SENSOR_ID }
  })
  console.log(`📊 Données existantes: ${initialDataCount}`)

  // 3. Démarrer le MQTT Listener
  console.log('\n📋 Étape 2: Démarrage du MQTT Listener')
  const mqttListener = startMQTTListener()
  
  // Attendre que la connexion s'établisse
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 4. Envoyer des données au format de l'appareil
  console.log('\n📋 Étape 3: Envoi des données de test')
  const brokerUrl = `mqtt://${brokerHost}:${port}`
  
  const client = mqtt.connect(brokerUrl, {
    protocol: "mqtt" as const,
    clientId: `final-test-${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 10000,
    keepalive: 60,
    protocolVersion: 4,
  })

  await new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('✅ Client de test connecté')
      
      // Données au format de votre appareil avec timestamp réaliste
      const deviceData = {
        "ts": Math.floor(Date.now() / 1000), // Timestamp Unix en secondes
        "PM1": 12,
        "PM25": 17,
        "PM10": 20,
        "O3": 83,
        "O3c": 53,
        "NO2v": 0.01,
        "NO2": 0,
        "VOCv": 0.08,
        "COv": 0.40,
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

  // 5. Attendre le traitement
  console.log('\n📋 Étape 4: Attente du traitement...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // 6. Vérifier les nouvelles données
  console.log('\n📋 Étape 5: Vérification des résultats')
  const finalDataCount = await prisma.sensorData.count({
    where: { sensorId: SENSOR_ID }
  })
  
  const newDataCount = finalDataCount - initialDataCount
  console.log(`📊 Nouvelles données: ${newDataCount}`)

  if (newDataCount > 0) {
    console.log('🎉 SUCCÈS! Données reçues et traitées!')
    
    // Afficher les dernières données
    const latestData = await prisma.sensorData.findMany({
      where: { sensorId: SENSOR_ID },
      orderBy: { timestamp: 'desc' },
      take: 1
    })
    
    if (latestData.length > 0) {
      console.log('📊 Dernières données reçues:')
      console.log(JSON.stringify(latestData[0], null, 2))
    }
    
    // Vérifier le statut du capteur
    const updatedSensor = await prisma.sensor.findUnique({
      where: { id: SENSOR_ID }
    })
    console.log(`🚥 Nouveau statut du capteur: ${updatedSensor?.status}`)
    
  } else {
    console.log('❌ ÉCHEC! Aucune nouvelle donnée reçue.')
    console.log('💡 Vérifiez les logs du serveur pour voir les erreurs.')
  }

  // 7. Nettoyer
  console.log('\n📋 Étape 6: Nettoyage')
  await stopMQTTListener()
  await prisma.$disconnect()
  
  console.log('✅ Test terminé!')
}

finalTest().catch(console.error) 