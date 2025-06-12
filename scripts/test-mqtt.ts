import { startMQTTListener, stopMQTTListener, getMQTTStats, isMQTTConnected } from '../lib/mqtt-listener'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

async function testMQTTConnection() {
  console.log('🧪 Test de la connexion MQTT...\n')
  
  // Vérifier les variables d'environnement
  console.log('📋 Configuration MQTT:')
  console.log(`  - Broker URL: ${process.env.MQTT_BROKER_URL || 'mqtts://z166d525.ala.us-east-1.emqxsl.com:8883'}`)
  console.log(`  - Port: ${process.env.MQTT_PORT || '8883'}`)
  console.log(`  - Username: ${process.env.MQTT_USERNAME ? '✅ Configuré' : '❌ Non configuré'}`)
  console.log(`  - Password: ${process.env.MQTT_PASSWORD ? '✅ Configuré' : '❌ Non configuré'}\n`)

  // Démarrer le service MQTT
  const mqttService = startMQTTListener()
  
  // Attendre la connexion
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Vérifier le statut de connexion
  const isConnected = isMQTTConnected()
  console.log(`🔍 Statut de connexion: ${isConnected ? '✅ Connecté' : '❌ Déconnecté'}`)
  
  // Afficher les statistiques
  const stats = getMQTTStats()
  if (stats) {
    console.log('\n📊 Statistiques MQTT:')
    console.log(`  - Connecté à: ${stats.connectedAt || 'Non connecté'}`)
    console.log(`  - Dernier message: ${stats.lastMessage || 'Aucun'}`)
    console.log(`  - Messages reçus: ${stats.messagesReceived}`)
    console.log(`  - Nombre de reconnexions: ${stats.reconnectCount}`)
    console.log(`  - Erreurs: ${stats.errors}`)
  }

  // Simuler des données de test (optionnel)
  if (isConnected && process.argv.includes('--simulate')) {
    console.log('\n🎭 Simulation de données de capteur...')
    
    const testData = {
      sensorId: 'test-sensor-001',
      timestamp: new Date().toISOString(),
      pm1_0: 12.5,
      pm2_5: 15.8,
      pm10: 20.2,
      o3_raw: 45.2,
      o3_corrige: 42.8,
      no2_voltage_mv: 2.5,
      no2_ppb: 25.3,
      voc_voltage_mv: 1.8,
      co_voltage_mv: 3.2,
      co_ppb: 0.8
    }
    
    console.log('Test data:', JSON.stringify(testData, null, 2))
  }

  // Attendre un peu plus pour observer les messages
  if (process.argv.includes('--monitor')) {
    console.log('\n👁️ Mode monitoring activé (Ctrl+C pour arrêter)...')
    
    const monitorInterval = setInterval(() => {
      const currentStats = getMQTTStats()
      const connected = isMQTTConnected()
      
      console.log(`[${new Date().toISOString()}] Connecté: ${connected ? '✅' : '❌'} | Messages: ${currentStats?.messagesReceived || 0} | Erreurs: ${currentStats?.errors || 0}`)
    }, 10000) // Toutes les 10 secondes
    
    // Gérer l'arrêt propre
    process.on('SIGINT', async () => {
      console.log('\n🛑 Arrêt du monitoring...')
      clearInterval(monitorInterval)
      await stopMQTTListener()
      process.exit(0)
    })
    
    return // Ne pas arrêter automatiquement en mode monitoring
  }

  // Arrêter le service après le test
  console.log('\n🛑 Arrêt du service de test...')
  await stopMQTTListener()
  
  console.log('✅ Test terminé')
}

// Gestion des erreurs
process.on('uncaughtException', async (error) => {
  console.error('❌ Erreur non gérée:', error)
  await stopMQTTListener()
  process.exit(1)
})

process.on('unhandledRejection', async (reason) => {
  console.error('❌ Promesse rejetée non gérée:', reason)
  await stopMQTTListener()
  process.exit(1)
})

// Exécuter le test
testMQTTConnection().catch(async (error) => {
  console.error('❌ Erreur lors du test:', error)
  await stopMQTTListener()
  process.exit(1)
}) 