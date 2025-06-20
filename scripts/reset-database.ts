import { prisma } from '../lib/prisma'

async function resetDatabase() {
  console.log('🗑️  Nettoyage de la base de données...\n')

  try {
    // 1. Compter les données actuelles
    const sensorsCount = await prisma.sensor.count()
    const dataCount = await prisma.sensorData.count()
    
    console.log(`📊 État actuel:`)
    console.log(`  • Capteurs: ${sensorsCount}`)
    console.log(`  • Données: ${dataCount}`)
    
    if (sensorsCount === 0 && dataCount === 0) {
      console.log('✅ Base de données déjà vide!')
      return
    }

    console.log('\n🗑️  Suppression en cours...')

    // 2. Supprimer toutes les données de capteurs (en premier à cause des clés étrangères)
    const deletedData = await prisma.sensorData.deleteMany({})
    console.log(`✅ ${deletedData.count} données de capteurs supprimées`)

    // 3. Supprimer tous les capteurs
    const deletedSensors = await prisma.sensor.deleteMany({})
    console.log(`✅ ${deletedSensors.count} capteurs supprimés`)

    // 4. Vérification finale
    const finalSensorsCount = await prisma.sensor.count()
    const finalDataCount = await prisma.sensorData.count()
    
    console.log('\n📊 État final:')
    console.log(`  • Capteurs: ${finalSensorsCount}`)
    console.log(`  • Données: ${finalDataCount}`)
    
    if (finalSensorsCount === 0 && finalDataCount === 0) {
      console.log('\n🎉 Base de données complètement nettoyée!')
      console.log('💡 Vous pouvez maintenant créer un nouveau capteur via l\'interface web.')
    } else {
      console.log('\n⚠️  Nettoyage incomplet, vérifiez les contraintes de base de données.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

console.log('🚨 ATTENTION: Cette opération va supprimer TOUTES les données!')
console.log('📋 Vous allez supprimer:')
console.log('  • Tous les capteurs')
console.log('  • Toutes les données de mesures')
console.log('  • Tous les historiques')
console.log('')

resetDatabase().catch(console.error) 