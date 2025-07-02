#!/usr/bin/env tsx

import { realtimeService } from '../lib/realtime-service'

async function testRealtimeUpdates() {
  console.log('🧪 Test des mises à jour temps réel')
  
  // Démarrer le service temps réel
  realtimeService.start()
  
  // Écouter les événements
  realtimeService.on('webhookUpdate', (update) => {
    console.log('🚀 Événement webhookUpdate reçu:', update)
  })
  
  realtimeService.on('statusUpdate', () => {
    console.log('🔄 Événement statusUpdate reçu')
  })
  
  // Simuler des mises à jour webhook
  const testSensors = [
    { id: 'sensor-1', name: 'Capteur Test 1' },
    { id: 'sensor-2', name: 'Capteur Test 2' },
    { id: 'sensor-3', name: 'Capteur Test 3' }
  ]
  
  console.log('📡 Simulation de mises à jour webhook...')
  
  for (let i = 0; i < testSensors.length; i++) {
    const sensor = testSensors[i]
    
    // Attendre 2 secondes entre chaque mise à jour
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log(`📊 Simulation webhook pour ${sensor.name}`)
    
    await realtimeService.triggerWebhookUpdate(sensor.id, {
      sensorName: sensor.name,
      status: i === 0 ? 'GREEN' : i === 1 ? 'ORANGE' : 'RED',
      timestamp: new Date(),
      data: {
        pm2_5: Math.random() * 50,
        pm10: Math.random() * 100,
        temperature: 20 + Math.random() * 10
      }
    })
  }
  
  // Attendre un peu puis arrêter
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('⏹️ Arrêt du service temps réel')
  realtimeService.stop()
  
  console.log('✅ Test terminé')
}

// Exécuter le test
testRealtimeUpdates().catch(console.error) 