import mqtt from 'mqtt'

const brokerHost = process.env.MQTT_BROKER_HOST || '34.38.83.146'

async function testAllMQTTProtocols() {
  console.log('🔌 Test de tous les protocoles MQTT disponibles\n')
  
  const configs = [
    { name: 'TCP Standard', port: 1883, protocol: 'mqtt' },
    { name: 'SSL/TLS', port: 8883, protocol: 'mqtts' },
    { name: 'WebSocket', port: 8083, protocol: 'ws' },
    { name: 'WebSocket SSL', port: 8084, protocol: 'wss' }
  ]

  for (const config of configs) {
    console.log(`\n📡 Test ${config.name} (${config.protocol}://${brokerHost}:${config.port})`)
    
    try {
      const success = await testSingleProtocol(config)
      if (success) {
        console.log(`✅ ${config.name}: CONNEXION RÉUSSIE!`)
      } else {
        console.log(`❌ ${config.name}: ÉCHEC`)
      }
    } catch (error) {
      console.log(`❌ ${config.name}: ${error.message}`)
    }
  }
}

function testSingleProtocol(config: any): Promise<boolean> {
  return new Promise((resolve) => {
    const brokerUrl = `${config.protocol}://${brokerHost}:${config.port}`
    
    const options = {
      clientId: `test-${config.name.toLowerCase().replace(/[^a-z]/g, '')}-${Date.now()}`,
      clean: true,
      connectTimeout: 5000,
      keepalive: 30,
      reconnectPeriod: 0,
      rejectUnauthorized: false
    }
    
    const client = mqtt.connect(brokerUrl, options)
    let resolved = false
    
    const cleanup = (result: boolean) => {
      if (!resolved) {
        resolved = true
        client.removeAllListeners()
        client.end(true)
        resolve(result)
      }
    }
    
    client.on('connect', () => {
      console.log(`   ✅ Connexion établie!`)
      cleanup(true)
    })
    
    client.on('error', (error) => {
      console.log(`   ❌ Erreur: ${error.message}`)
      cleanup(false)
    })
    
    setTimeout(() => {
      cleanup(false)
    }, 6000)
  })
}

// Exécution
testAllMQTTProtocols()
  .then(() => {
    console.log('\n🎯 Test terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur:', error)
    process.exit(1)
  }) 