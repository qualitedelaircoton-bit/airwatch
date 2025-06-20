import { prisma } from '../lib/prisma'

async function checkSensor() {
  const sensorId = 'cmc4xq76l0001u808bvwm7xo5'
  
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
  } else {
    console.log('❌ Capteur PAS TROUVÉ')
    console.log('📋 Capteurs disponibles:')
    
    const allSensors = await prisma.sensor.findMany({
      select: { id: true, name: true, status: true }
    })
    
    allSensors.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.id}) - ${s.status}`)
    })
  }
  
  await prisma.$disconnect()
}

checkSensor().catch(console.error) 