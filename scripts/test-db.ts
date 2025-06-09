import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log("🔍 Test de connexion à la base de données...")
    
    // Compter les capteurs
    const sensorCount = await prisma.sensor.count()
    console.log(`📊 Nombre de capteurs: ${sensorCount}`)
    
    // Lister les capteurs
    const sensors = await prisma.sensor.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    })
    
    console.log("\n📍 Capteurs trouvés:")
    sensors.forEach((sensor, index) => {
      console.log(`  ${index + 1}. ${sensor.name} - Statut: ${sensor.status}`)
    })
    
    // Compter les données
    const dataCount = await prisma.sensorData.count()
    console.log(`\n📈 Nombre de points de données: ${dataCount}`)
    
    // Tester une requête simple
    const recentData = await prisma.sensorData.findMany({
      take: 3,
      orderBy: { timestamp: "desc" },
      include: {
        sensor: {
          select: { name: true }
        }
      }
    })
    
    console.log("\n📊 Données récentes:")
    recentData.forEach((data, index) => {
      console.log(`  ${index + 1}. ${data.sensor.name} - PM2.5: ${data.pm2_5}µg/m³`)
    })
    
    console.log("\n✅ Test de base de données réussi!")
    
  } catch (error) {
    console.error("❌ Erreur lors du test:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase() 