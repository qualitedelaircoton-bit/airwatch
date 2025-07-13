import { prisma } from '../lib/prisma'

async function clearTestData() {
  console.log('🧹 Nettoyage complet de la base de données de test...\n')

  try {
    // 1. Compter les données actuelles
    const sensorsCount = await prisma.sensor.count()
    const dataCount = await prisma.sensorData.count()
    const alertsCount = await prisma.alert.count()
    
    console.log(`📊 État actuel:`)
    console.log(`  • Capteurs: ${sensorsCount}`)
    console.log(`  • Données: ${dataCount}`)
    console.log(`  • Alertes: ${alertsCount}`)
    
    if (sensorsCount === 0 && dataCount === 0 && alertsCount === 0) {
      console.log('✅ Base de données déjà vide!')
      return
    }

    console.log('\n🗑️  Suppression en cours...')

    // 2. Supprimer toutes les alertes (en premier à cause des clés étrangères)
    const deletedAlerts = await prisma.alert.deleteMany({})
    console.log(`✅ ${deletedAlerts.count} alertes supprimées`)

    // 3. Supprimer toutes les données de capteurs
    const deletedData = await prisma.sensorData.deleteMany({})
    console.log(`✅ ${deletedData.count} données de capteurs supprimées`)

    // 4. Supprimer tous les capteurs
    const deletedSensors = await prisma.sensor.deleteMany({})
    console.log(`✅ ${deletedSensors.count} capteurs supprimés`)

    // 5. Vérification finale
    const finalSensorsCount = await prisma.sensor.count()
    const finalDataCount = await prisma.sensorData.count()
    const finalAlertsCount = await prisma.alert.count()
    
    console.log('\n📊 État final:')
    console.log(`  • Capteurs: ${finalSensorsCount}`)
    console.log(`  • Données: ${finalDataCount}`)
    console.log(`  • Alertes: ${finalAlertsCount}`)
    
    if (finalSensorsCount === 0 && finalDataCount === 0 && finalAlertsCount === 0) {
      console.log('\n🎉 Base de données complètement nettoyée!')
      console.log('💡 Vous pouvez maintenant créer de nouveaux capteurs pour la production.')
    } else {
      console.log('\n⚠️  Nettoyage incomplet, vérifiez les contraintes de base de données.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
    if (error instanceof Error) {
      console.error('Détails:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

console.log('🚨 ATTENTION: Cette opération va supprimer TOUTES les données de test!')
console.log('📋 Vous allez supprimer:')
console.log('  • Tous les capteurs')
console.log('  • Toutes les données de mesures')
console.log('  • Toutes les alertes')
console.log('  • Tous les historiques')
console.log('')
console.log('🔒 Cette action est irréversible!')
console.log('')

clearTestData().catch(console.error) 