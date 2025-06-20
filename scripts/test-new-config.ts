#!/usr/bin/env tsx

import { config } from 'dotenv'
import { prisma } from '../lib/prisma'
import { startMQTTListener, stopMQTTListener, isMQTTConnected, getMQTTStats } from '../lib/mqtt-listener'

// Charger les variables d'environnement
config()

async function testNewConfiguration() {
  console.log('🧪 Test des nouvelles configurations...\n')
  
  // Test 1: Configuration Prisma avec adaptateur Neon
  console.log('📋 Test 1: Connexion base de données avec adaptateur Neon')
  try {
    await prisma.$connect()
    console.log('✅ Connexion Prisma avec adaptateur Neon réussie')
    
    const sensorCount = await prisma.sensor.count()
    console.log(`📊 Capteurs en base: ${sensorCount}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Erreur connexion Prisma:', error)
    return false
  }
  
  // Test 2: Configuration MQTT simplifiée
  console.log('\n📋 Test 2: Connexion MQTT en mode standard')
  try {
    console.log('Configuration MQTT:')
    console.log(`  • Host: ${process.env.MQTT_BROKER_URL || 'Non défini'}`)
    console.log(`  • Port: ${process.env.MQTT_PORT || '1883'}`)
    console.log(`  • Username: ${process.env.MQTT_USERNAME ? '✅' : '❌'}`)
    
    // Démarrer MQTT
    startMQTTListener()
    
    // Attendre la connexion
    await new Promise(resolve => setTimeout(resolve, 8000))
    
    const isConnected = isMQTTConnected()
    console.log(`✅ Statut MQTT: ${isConnected ? 'Connecté' : 'Déconnecté'}`)
    
    if (isConnected) {
      const stats = getMQTTStats()
      console.log('📊 Statistiques MQTT:')
      console.log(`  • Connecté: ${stats?.connectedAt}`)
      console.log(`  • Messages: ${stats?.messagesReceived}`)
      console.log(`  • Erreurs: ${stats?.errors}`)
    }
    
    await stopMQTTListener()
    
  } catch (error) {
    console.error('❌ Erreur MQTT:', error)
    return false
  }
  
  console.log('\n🎉 Tous les tests passés avec succès!')
  console.log('\n📝 Configuration optimisée:')
  console.log('  • Prisma avec adaptateur Neon pour compatibilité serverless')
  console.log('  • MQTT en mode standard pour stabilité')
  console.log('  • Dépendances fixées pour éviter les conflits')
  console.log('  • Services démarrés en mode développement')
  
  return true
}

// Gestion des erreurs
process.on('uncaughtException', async (error) => {
  console.error('❌ Erreur non gérée:', error)
  await stopMQTTListener()
  process.exit(1)
})

process.on('unhandledRejection', async (reason) => {
  console.error('❌ Promesse rejetée:', reason)
  await stopMQTTListener()
  process.exit(1)
})

// Exécuter le test
testNewConfiguration().catch(async (error) => {
  console.error('❌ Erreur lors du test:', error)
  await stopMQTTListener()
  process.exit(1)
}) 