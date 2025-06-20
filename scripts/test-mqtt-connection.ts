#!/usr/bin/env tsx

import mqtt from 'mqtt'

console.log('🔌 Test de connexion MQTT - Configuration complète\n')

// Utiliser une variable d'environnement pour l'adresse du broker
const brokerHost = process.env.MQTT_BROKER_HOST || 'localhost'
const configs = [
  { name: 'TCP Standard', port: 1883, protocol: 'mqtt' },
  { name: 'SSL/TLS', port: 8883, protocol: 'mqtts' },
  { name: 'WebSocket', port: 8083, protocol: 'ws' },
  { name: 'WebSocket SSL', port: 8084, protocol: 'wss' }
]

console.log('📋 Configuration EMQX détectée:')
console.log('  • tcp    0.0.0.0:1883  (0/Infinity connections)')
console.log('  • ssl    0.0.0.0:8883  (0/Infinity connections)')  
console.log('  • ws     0.0.0.0:8083  (0/Infinity connections)')
console.log('  • wss    0.0.0.0:8084  (0/Infinity connections)')
console.log('\n🎯 Objectif: Établir AU MOINS une connexion pour passer de 0 à 1\n')

// Construire l'URL pour chaque configuration
for (const config of configs) {
  console.log(`\n📡 Test ${config.name}...`)
  console.log(`   Protocol: ${config.protocol}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   TLS: ${config.tls ? 'activé' : 'désactivé'}`)
  
  const brokerUrl = `${config.protocol}://${brokerHost}:${config.port}`
  
  const options = {
    clientId: `test-${config.name.toLowerCase().replace(/[^a-z]/g, '')}-${Date.now()}`,
    clean: true,
    connectTimeout: 8000,
    keepalive: 30,
    reconnectPeriod: 0, // Pas de reconnexion auto pour ce test
    rejectUnauthorized: false,
    // PAS de username/password - broker ouvert
  }
  
  try {
    const result = await testSingleConnection(config, brokerHost, options)
    if (result) {
      console.log(`✅ SUCCÈS! Connexion établie sur ${config.name}`)
      console.log(`📊 Votre EMQX devrait maintenant montrer 1 connexion active`)
      return { success: true, config }
    }
  } catch (error) {
    console.error(`❌ ${config.name}: ${error.message}`)
    if (error.code === 'CONNACK_TIMEOUT' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT') {
      console.log('🔥 Erreurs réseau probables:')
      console.log('   • Firewall bloquant la connexion')
      console.log('   • Serveur MQTT inaccessible')
      console.log('   • Port fermé ou non configuré')
      console.log('   • Problème de routage réseau')
    }
  }
}

return { success: false, config: null }

function testSingleConnection(config: any, host: string, options: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const brokerUrl = `${config.protocol}://${host}:${config.port}`
    console.log(`   🔌 Connexion à ${brokerUrl}...`)
    
    const client = mqtt.connect(brokerUrl, options)
    let resolved = false
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true
        client.removeAllListeners()
        client.end(true)
      }
    }
    
    client.on('connect', (connack) => {
      console.log(`   ✅ Connecté! (connack: ${JSON.stringify(connack)})`)
      
      // Test d'abonnement pour vérifier la fonctionnalité complète
      client.subscribe('test/topic', { qos: 1 }, (err, granted) => {
        if (err) {
          console.log(`   ⚠️ Erreur abonnement: ${err.message}`)
        } else {
          console.log(`   📡 Abonnement réussi: ${JSON.stringify(granted)}`)
        }
        
        // Maintenir la connexion 3 secondes pour vérifier la stabilité
        setTimeout(() => {
          console.log(`   🔗 Connexion stable pendant 3s`)
          cleanup()
          resolve(true)
        }, 3000)
      })
    })
    
    client.on('error', (error) => {
      console.log(`   ❌ Erreur: ${error.message}`)
      cleanup()
      reject(error)
    })
    
    client.on('close', () => {
      console.log(`   🔌 Connexion fermée`)
    })
    
    client.on('offline', () => {
      console.log(`   📴 Client hors ligne`)
    })
    
    // Timeout plus long pour connexions SSL/WS
    const timeout = config.protocol.includes('s') || config.protocol.includes('ws') ? 12000 : 8000
    setTimeout(() => {
      if (!resolved) {
        cleanup()
        reject(new Error(`Timeout après ${timeout/1000}s`))
      }
    }, timeout)
  })
}

// Test de maintien de connexion permanente
async function testPermanentConnection(config: any) {
  console.log(`\n🔄 Test de connexion permanente sur ${config.name}...`)
  
  const brokerUrl = `${config.protocol}://${brokerHost}:${config.port}`
  const options = {
    clientId: `permanent-listener-${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    keepalive: 60,
    reconnectPeriod: 5000, // Reconnexion automatique
    rejectUnauthorized: false,
  }
  
  const client = mqtt.connect(brokerUrl, options)
  
  client.on('connect', () => {
    console.log('✅ Connexion permanente établie!')
    console.log('📡 Abonnement aux topics de capteurs...')
    
    // S'abonner aux topics de données comme la vraie plateforme
    client.subscribe('sensors/+/data', { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Erreur abonnement sensors:', err)
      } else {
        console.log('✅ Abonné à sensors/+/data')
      }
    })
    
    console.log('\n🎯 Connexion maintenue - Vérifiez votre dashboard EMQX:')
    console.log('   • Connections devrait passer de 0 à 1')
    console.log('   • Subscriptions devrait montrer sensors/+/data')
    console.log('\n⏱️ Maintien pendant 30 secondes puis arrêt...')
  })
  
  client.on('message', (topic, payload) => {
    console.log(`📩 Message reçu sur ${topic}: ${payload.toString().substring(0, 100)}...`)
  })
  
  client.on('error', (error) => {
    console.error('❌ Erreur connexion permanente:', error.message)
  })
  
  client.on('reconnect', () => {
    console.log('🔄 Reconnexion en cours...')
  })
  
  // Maintenir 30 secondes puis nettoyer
  setTimeout(() => {
    console.log('\n🛑 Arrêt du test de connexion permanente')
    client.end()
    process.exit(0)
  }, 30000)
}

// Exécution principale
testEMQXConnection()
  .then(async (result) => {
    if (result.success) {
      console.log(`\n🎉 DIAGNOSTIC: Connexion possible sur ${result.config.name}`)
      console.log('🔧 SOLUTION: Utiliser cette configuration dans mqtt-listener.ts')
      
      // Lancer le test permanent sur la config qui marche
      await testPermanentConnection(result.config)
    } else {
      console.log('\n❌ DIAGNOSTIC: Aucune connexion possible')
      console.log('🔍 CAUSES POSSIBLES:')
              console.log('   • Firewall bloquant la connexion au broker')
      console.log('   • EMQX non démarré ou inaccessible')
      console.log('   • Réseau local/VPN bloquant les ports')
      console.log('   • Configuration EMQX limitant les connexions externes')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error.message)
    process.exit(1)
  }) 