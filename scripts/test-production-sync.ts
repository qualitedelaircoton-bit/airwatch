import mqtt from 'mqtt'
import { prisma } from '../lib/prisma'

const NEW_SENSOR_ID = 'cmc535h2i0000l704mwuntrhu'  // zogbo-essai
const brokerHost = process.env.MQTT_BROKER_HOST || '34.38.83.146'
const port = 1883

async function testProductionSync() {
  console.log('🧪 Test de synchronisation en production\n')

  try {
    // 1. Vérifier l'état du capteur
    console.log('📋 Étape 1: Vérification du capteur')
    
    const sensor = await prisma.sensor.findUnique({
      where: { id: NEW_SENSOR_ID }
    })
    
    if (!sensor) {
      console.log('❌ Capteur introuvable!')
      return
    }
    
    console.log(`✅ Capteur: ${sensor.name}`)
    console.log(`   Statut actuel: ${sensor.status}`)
    console.log(`   Dernière vue: ${sensor.lastSeen ? new Date(sensor.lastSeen).toLocaleString('fr-FR') : 'Jamais'}`)

    // 2. Tester l'API de santé
    console.log('\n📋 Étape 2: Vérification de l\'API de santé')
    
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log(`✅ API Santé: ${healthData.status}`)
        console.log(`   Base de données: ${healthData.database}`)
        console.log(`   MQTT connecté: ${healthData.mqtt?.connected ? '✅' : '❌'}`)
        
        if (!healthData.mqtt?.connected) {
          console.log('⚠️  MQTT non connecté, l\'API de santé devrait le redémarrer automatiquement')
        }
      } else {
        console.log(`❌ API Santé échouée: ${healthResponse.status}`)
      }
    } catch (apiError) {
      console.log('❌ Erreur API Santé:', apiError instanceof Error ? apiError.message : 'Erreur inconnue')
    }

    // 3. Tester le statut MQTT
    console.log('\n📋 Étape 3: Vérification du statut MQTT')
    
    try {
      const mqttResponse = await fetch('http://localhost:3000/api/mqtt/status')
      if (mqttResponse.ok) {
        const mqttData = await mqttResponse.json()
        console.log(`🔌 MQTT Status: ${mqttData.connected ? '✅ Connecté' : '❌ Déconnecté'}`)
        
        if (mqttData.stats) {
          console.log(`   Messages reçus: ${mqttData.stats.messagesReceived || 0}`)
          console.log(`   Erreurs: ${mqttData.stats.errors || 0}`)
        }
      } else {
        console.log(`❌ API MQTT Status échouée: ${mqttResponse.status}`)
      }
    } catch (mqttApiError) {
      console.log('❌ Erreur API MQTT:', mqttApiError instanceof Error ? mqttApiError.message : 'Erreur inconnue')
    }

    // 4. Envoyer des données de test
    console.log('\n📋 Étape 4: Envoi de données de test')
    
    const client = mqtt.connect(`mqtt://${brokerHost}:${port}`, {
      protocol: "mqtt" as const,
      clientId: `production-test-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 10000,
      keepalive: 60,
      protocolVersion: 4,
    })

    const initialDataCount = await prisma.sensorData.count({
      where: { sensorId: NEW_SENSOR_ID }
    })

    await new Promise((resolve, reject) => {
      client.on('connect', () => {
        console.log('✅ Client connecté')
        
        // Données exactes de l'utilisateur
        const deviceData = {
          "ts": 275,
          "PM1": 42,
          "PM25": 63,
          "PM10": 75,
          "O3": 245,
          "O3c": 215,
          "NO2v": 0.01,
          "NO2": 0,
          "VOCv": 0.11,
          "COv": 0.43,
          "CO": 0
        }

        const topic = `sensors/${NEW_SENSOR_ID}/data`
        console.log(`📤 Envoi vers: ${topic}`)

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

    // 5. Vérifier la réception avec retry
    console.log('\n📋 Étape 5: Vérification de la réception (30s)')
    
    let dataReceived = false
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`   Vérification ${attempt}/10...`)
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const currentDataCount = await prisma.sensorData.count({
        where: { sensorId: NEW_SENSOR_ID }
      })
      
      const newDataCount = currentDataCount - initialDataCount
      
      if (newDataCount > 0) {
        console.log(`🎉 SUCCÈS! ${newDataCount} nouvelle(s) donnée(s) reçue(s)!`)
        
        const latestData = await prisma.sensorData.findFirst({
          where: { sensorId: NEW_SENSOR_ID },
          orderBy: { timestamp: 'desc' }
        })
        
        if (latestData) {
          console.log(`📊 Dernière donnée: ${latestData.timestamp.toLocaleString('fr-FR')}`)
          console.log(`   PM2.5: ${latestData.pm2_5}µg/m³`)
          console.log(`   Données brutes: ${latestData.rawData ? JSON.stringify(latestData.rawData) : 'N/A'}`)
        }
        
        // Vérifier le statut du capteur
        const updatedSensor = await prisma.sensor.findUnique({
          where: { id: NEW_SENSOR_ID }
        })
        console.log(`🚥 Statut mis à jour: ${updatedSensor?.status}`)
        
        dataReceived = true
        break
      }
    }
    
    if (!dataReceived) {
      console.log('❌ Aucune donnée reçue après 30 secondes')
      console.log('🔧 Essayez de redémarrer le MQTT Listener:')
      console.log('   curl -X POST http://localhost:3000/api/mqtt/status')
    }

    // 6. Test de l'API en temps réel
    console.log('\n📋 Étape 6: Test de l\'API de données')
    
    try {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const dataResponse = await fetch(
        `http://localhost:3000/api/sensors/${NEW_SENSOR_ID}/data?from=${yesterday.toISOString()}&to=${now.toISOString()}`
      )
      
      if (dataResponse.ok) {
        const apiData = await dataResponse.json()
        console.log(`✅ API retourne: ${apiData.length} points`)
        
        if (apiData.length > 0) {
          const latest = apiData[apiData.length - 1]
          console.log(`📊 Plus récent via API: ${new Date(latest.timestamp).toLocaleString('fr-FR')}`)
        }
      } else {
        console.log(`❌ API données échouée: ${dataResponse.status}`)
      }
    } catch (apiError) {
      console.log('❌ Erreur API données:', apiError instanceof Error ? apiError.message : 'Erreur inconnue')
    }

    console.log('\n🎯 Résumé des solutions appliquées:')
    console.log('   ✅ Rafraîchissement automatique toutes les 30s (dashboard)')
    console.log('   ✅ Rafraîchissement automatique toutes les 15s (données capteur)')
    console.log('   ✅ Indicateur de dernière mise à jour')
    console.log('   ✅ API de santé qui redémarre MQTT automatiquement')
    console.log('   ✅ API de redémarrage manuel MQTT')
    console.log('   ✅ Correction du timestamp relatif')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProductionSync().catch(console.error) 