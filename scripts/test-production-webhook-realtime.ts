#!/usr/bin/env tsx

interface WebhookPayload {
  clientid: string
  username?: string
  topic: string
  payload: string
  qos: number
  retain: boolean
  timestamp: number
}

async function testProductionWebhookRealtime() {
  const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://air-quality-platform.vercel.app'
  const WEBHOOK_SECRET = process.env.MQTT_WEBHOOK_SECRET || 'test-secret'
  
  console.log('🧪 Test du webhook en production avec mises à jour temps réel')
  console.log(`📍 URL: ${PRODUCTION_URL}`)
  
  // Test 1: Vérifier que l'endpoint webhook répond
  console.log('\n1️⃣ Test de connectivité webhook...')
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/mqtt/webhook`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Webhook accessible:', data)
    } else {
      console.log('❌ Webhook non accessible:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Erreur de connectivité:', error)
  }
  
  // Test 2: Vérifier l'API des dernières mises à jour
  console.log('\n2️⃣ Test de l\'API des dernières mises à jour...')
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sensors/last-updates`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API dernières mises à jour:', data)
    } else {
      console.log('❌ API non accessible:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Erreur API:', error)
  }
  
  // Test 3: Envoyer un webhook de test
  console.log('\n3️⃣ Envoi d\'un webhook de test...')
  
  const testPayload: WebhookPayload = {
    clientid: 'test-client',
    username: 'test-user',
    topic: 'sensors/test-sensor-realtime/data',
    payload: JSON.stringify({
      ts: Math.floor(Date.now() / 1000),
      PM1: 15.5,
      PM25: 25.3,
      PM10: 45.7,
      O3: 45.2,
      O3c: 42.1,
      NO2v: 0.85,
      NO2: 12.3,
      VOCv: 1.2,
      COv: 0.95,
      CO: 8.7,
      temp: 24.5,
      hum: 65.2,
      pres: 1013.2
    }),
    qos: 1,
    retain: false,
    timestamp: Date.now()
  }
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/mqtt/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify(testPayload)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Webhook envoyé avec succès:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erreur webhook:', response.status, response.statusText, errorText)
    }
  } catch (error) {
    console.error('❌ Erreur envoi webhook:', error)
  }
  
  // Test 4: Vérifier les mises à jour après webhook
  console.log('\n4️⃣ Vérification des mises à jour après webhook...')
  
  // Attendre un peu pour que le webhook soit traité
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sensors/last-updates`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Mises à jour après webhook:', data)
      
      if (data.lastWebhookUpdate) {
        const webhookTime = new Date(data.lastWebhookUpdate)
        const now = new Date()
        const diff = now.getTime() - webhookTime.getTime()
        
        console.log(`⏱️ Temps écoulé depuis le webhook: ${Math.floor(diff / 1000)}s`)
        
        if (diff < 10000) { // Moins de 10 secondes
          console.log('✅ Webhook traité rapidement')
        } else {
          console.log('⚠️ Webhook traité avec délai')
        }
      } else {
        console.log('⚠️ Aucune mise à jour webhook détectée')
      }
    } else {
      console.log('❌ Impossible de vérifier les mises à jour:', response.status)
    }
  } catch (error) {
    console.error('❌ Erreur vérification:', error)
  }
  
  // Test 5: Vérifier l'API des capteurs
  console.log('\n5️⃣ Vérification de l\'API des capteurs...')
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/sensors`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (response.ok) {
      const sensors = await response.json()
      console.log(`✅ ${sensors.length} capteurs récupérés`)
      
      // Afficher les capteurs récents
      const recentSensors = sensors.filter((s: any) => {
        if (!s.lastSeen) return false
        const lastSeen = new Date(s.lastSeen)
        const now = new Date()
        return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000 // 5 minutes
      })
      
      console.log(`📊 ${recentSensors.length} capteurs actifs récemment`)
    } else {
      console.log('❌ Erreur API capteurs:', response.status)
    }
  } catch (error) {
    console.error('❌ Erreur récupération capteurs:', error)
  }
  
  console.log('\n✅ Test terminé')
}

// Exécuter le test
testProductionWebhookRealtime().catch(console.error) 