#!/usr/bin/env tsx

import { execSync } from 'child_process'

async function testUIRealtime() {
  const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://air-quality-platform.vercel.app'
  
  console.log('🧪 Test de l\'interface utilisateur temps réel')
  console.log(`📍 URL: ${PRODUCTION_URL}`)
  
  try {
    // Test 1: Vérifier que la page principale se charge
    console.log('\n1️⃣ Test de chargement de la page principale...')
    
    const response = await fetch(PRODUCTION_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      
      // Vérifier la présence des éléments temps réel
      const hasRealtimeIndicator = html.includes('realtime-indicator') || html.includes('RealtimeIndicator')
      const hasRealtimeStats = html.includes('realtime-stats') || html.includes('RealtimeStats')
      const hasWebhookNotification = html.includes('webhook-notification') || html.includes('WebhookNotification')
      const hasRefreshButton = html.includes('RefreshCw') || html.includes('Actualiser')
      
      console.log('✅ Page principale accessible')
      console.log(`📊 Indicateur temps réel: ${hasRealtimeIndicator ? '✅ Présent' : '❌ Absent'}`)
      console.log(`📈 Statistiques temps réel: ${hasRealtimeStats ? '✅ Présentes' : '❌ Absentes'}`)
      console.log(`🔔 Notification webhook: ${hasWebhookNotification ? '✅ Présente' : '❌ Absente'}`)
      console.log(`🔄 Bouton actualisation: ${hasRefreshButton ? '✅ Présent' : '❌ Absent'}`)
      
    } else {
      console.log('❌ Page principale non accessible:', response.status)
    }
    
    // Test 2: Vérifier les APIs publiques
    console.log('\n2️⃣ Test des APIs publiques...')
    
    const apis = [
      '/api/sensors',
      '/api/sensors/last-updates',
      '/api/health'
    ]
    
    for (const api of apis) {
      try {
        const response = await fetch(`${PRODUCTION_URL}${api}`)
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ ${api}: ${response.status}`)
          
          if (api === '/api/sensors/last-updates') {
            console.log(`   📊 Capteurs: ${data.sensorsCount}, Actifs: ${data.activeSensors}`)
          }
        } else {
          console.log(`❌ ${api}: ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${api}: Erreur de connexion`)
      }
    }
    
    // Test 3: Vérifier le manifest PWA
    console.log('\n3️⃣ Test du manifest PWA...')
    
    try {
      const response = await fetch(`${PRODUCTION_URL}/manifest.webmanifest`)
      if (response.ok) {
        const manifest = await response.json()
        console.log('✅ Manifest PWA accessible')
        console.log(`   📱 Nom: ${manifest.name}`)
        console.log(`   🎨 Thème: ${manifest.theme_color}`)
      } else {
        console.log('❌ Manifest PWA non accessible:', response.status)
      }
    } catch (error) {
      console.log('❌ Erreur manifest PWA')
    }
    
    // Test 4: Vérifier les performances
    console.log('\n4️⃣ Test de performance...')
    
    const startTime = Date.now()
    const response = await fetch(`${PRODUCTION_URL}/api/sensors`)
    const endTime = Date.now()
    
    if (response.ok) {
      const duration = endTime - startTime
      console.log(`✅ Temps de réponse API: ${duration}ms`)
      
      if (duration < 1000) {
        console.log('   🚀 Performance excellente')
      } else if (duration < 3000) {
        console.log('   ⚡ Performance correcte')
      } else {
        console.log('   ⚠️ Performance lente')
      }
    }
    
    console.log('\n✅ Test de l\'interface terminé')
    console.log('\n🎯 Résumé des améliorations temps réel:')
    console.log('   • Indicateur temps réel avec statut visuel')
    console.log('   • Statistiques animées des capteurs')
    console.log('   • Notifications webhook en temps réel')
    console.log('   • Bouton d\'actualisation avec feedback')
    console.log('   • Polling optimisé (30s + 5s webhook)')
    console.log('   • API des dernières mises à jour')
    console.log('   • Interface PWA responsive')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testUIRealtime().catch(console.error) 