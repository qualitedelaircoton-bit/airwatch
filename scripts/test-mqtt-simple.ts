#!/usr/bin/env tsx

import mqtt from 'mqtt'
import * as fs from 'fs'
import * as path from 'path'

console.log('🔌 Test de connexion MQTT simple...\n')

// Utiliser une variable d'environnement pour l'adresse du broker
const brokerHost = process.env.MQTT_BROKER_HOST || 'localhost'
const port = 1883
  
const options = {
  host: brokerHost,
  port: port,
  protocol: "mqtt" as const,
  clientId: `test-client-${Math.random().toString(16).substr(2, 8)}`,
  clean: true,
  connectTimeout: 10000,
  reconnectPeriod: 1000,
  keepalive: 60,
  rejectUnauthorized: false,
  // PAS DE USERNAME/PASSWORD comme le simulateur
}
  
console.log('📋 Configuration de test:')
console.log(`  • Host: ${brokerHost}`)
console.log(`  • Port: ${port}`)
console.log(`  • ClientId: ${options.clientId}`)
console.log(`  • Sans credentials: OUI`)
  
async function testSimpleMQTT() {
  return new Promise((resolve, reject) => {
    console.log(`\n🔌 Connexion à ${brokerHost}:${port}...`)
    
    const brokerUrl = `mqtt://${brokerHost}:${port}`
    const client = mqtt.connect(brokerUrl, options)
    
    client.on('connect', () => {
      console.log('✅ CONNEXION MQTT RÉUSSIE!')
      console.log('🎉 Le problème était les credentials!')
      
      client.end()
      resolve(true)
    })
    
    client.on('error', (error) => {
      console.error('❌ Erreur MQTT:', error.message)
      reject(error)
    })
    
    setTimeout(() => {
      if (!client.connected) {
        console.error('❌ Timeout - Même sans credentials')
        client.end()
        reject(new Error('Timeout'))
      }
    }, 15000)
  })
}

testSimpleMQTT()
  .then(() => {
    console.log('\n🎯 SOLUTION TROUVÉE: Supprimer les credentials MQTT!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Échec même sans credentials:', error.message)
    process.exit(1)
  }) 