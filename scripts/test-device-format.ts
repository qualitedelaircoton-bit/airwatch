import mqtt from 'mqtt'

const SENSOR_ID = 'cmc4xq76l0001u808bvwm7xo5'  // L'ID de votre capteur
const brokerHost = process.env.MQTT_BROKER_HOST || '34.38.83.146'
const port = 1883

async function testDeviceFormat() {
  console.log('🧪 Test du format de données de l\'appareil...\n')

  const brokerUrl = `mqtt://${brokerHost}:${port}`
  console.log(`🔌 Connexion à ${brokerUrl}`)

  const client = mqtt.connect(brokerUrl, {
    protocol: "mqtt" as const,
    clientId: `test-device-${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 10000,
    keepalive: 60,
    protocolVersion: 4, // MQTT 3.1.1
  })

  client.on('connect', () => {
    console.log('✅ Connecté au broker MQTT')
    
    // Données au format de votre appareil
    const deviceData = {
      "ts": 113,
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
    console.log(`📤 Envoi des données vers le topic: ${topic}`)
    console.log('📊 Données:', JSON.stringify(deviceData, null, 2))

    client.publish(topic, JSON.stringify(deviceData), { qos: 1 }, (error) => {
      if (error) {
        console.error('❌ Erreur lors de l\'envoi:', error)
      } else {
        console.log('✅ Données envoyées avec succès!')
      }
      
      setTimeout(() => {
        client.end()
        console.log('🔌 Déconnexion du client de test')
      }, 2000)
    })
  })

  client.on('error', (error) => {
    console.error('❌ Erreur MQTT:', error)
    client.end()
  })

  client.on('close', () => {
    console.log('🔌 Connexion fermée')
    process.exit(0)
  })
}

console.log('📝 Test du format de données:')
console.log('  • Format appareil: {"ts":113,"PM1":12,"PM25":17,"PM10":20,"O3":83,"O3c":53,"NO2v":0.01,"NO2":0,"VOCv":0.08,"COv":0.40,"CO":0}')
console.log(`  • Topic: sensors/${SENSOR_ID}/data`)
console.log('  • Capteur ID:', SENSOR_ID)
console.log()

testDeviceFormat().catch(console.error) 