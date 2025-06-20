import { prisma } from '../lib/prisma'

async function checkSensor() {
  const sensorId = 'cmc535h2i0000l704mwuntrhu'  // Nouveau capteur
  
  console.log(`🔍 Recherche du capteur: ${sensorId}`)
  
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId }
  })
  
  if (sensor) {
    console.log('✅ Capteur trouvé:', {
      id: sensor.id,
      name: sensor.name,
      status: sensor.status,
      lastSeen: sensor.lastSeen,
      frequency: sensor.frequency
    })
    
    // Vérifier les données
    const dataCount = await prisma.sensorData.count({
      where: { sensorId }
    })
    console.log(`📊 Total données: ${dataCount}`)
    
    if (dataCount > 0) {
      const latestData = await prisma.sensorData.findMany({
        where: { sensorId },
        orderBy: { timestamp: 'desc' },
        take: 3
      })
      
      console.log('📈 Dernières données:')
      latestData.forEach((data, i) => {
        console.log(`  ${i + 1}. ${data.timestamp.toLocaleString('fr-FR')} - PM2.5: ${data.pm2_5}µg/m³`)
        console.log(`     Données brutes: ${data.rawData ? JSON.stringify(data.rawData) : 'N/A'}`)
      })
    }
  } else {
    console.log('❌ Capteur PAS TROUVÉ')
    console.log('📋 Capteurs disponibles:')
    
    const allSensors = await prisma.sensor.findMany({
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    
    allSensors.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.id}) - ${s.status}`)
      console.log(`     Créé le: ${s.createdAt.toLocaleString('fr-FR')}`)
    })
  }
  
  await prisma.$disconnect()
}

checkSensor().catch(console.error) 