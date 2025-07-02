async function testProductionEndpoints() {
  const baseUrl = 'https://air-quality-platform-o6vgs2hrz-fleurys-projects-8d96c12f.vercel.app'
  
  console.log('🔍 Testing production endpoints...\n')
  
  // Test 1: Health endpoint
  try {
    console.log('1. Testing /api/health')
    const healthResponse = await fetch(`${baseUrl}/api/health`)
    console.log('   Status:', healthResponse.status)
    console.log('   Headers:', Object.fromEntries(healthResponse.headers.entries()))
    const healthData = await healthResponse.text()
    console.log('   Response:', healthData.substring(0, 200) + (healthData.length > 200 ? '...' : ''))
    console.log('')
  } catch (error) {
    console.error('   Error:', error)
    console.log('')
  }
  
  // Test 2: MQTT Status endpoint
  try {
    console.log('2. Testing /api/mqtt/status')
    const statusResponse = await fetch(`${baseUrl}/api/mqtt/status`)
    console.log('   Status:', statusResponse.status)
    const statusData = await statusResponse.text()
    console.log('   Response:', statusData.substring(0, 200) + (statusData.length > 200 ? '...' : ''))
    console.log('')
  } catch (error) {
    console.error('   Error:', error)
    console.log('')
  }
  
  // Test 3: Webhook endpoint (GET should return method not allowed)
  try {
    console.log('3. Testing /api/mqtt/webhook (GET - should fail)')
    const webhookResponse = await fetch(`${baseUrl}/api/mqtt/webhook`)
    console.log('   Status:', webhookResponse.status)
    const webhookData = await webhookResponse.text()
    console.log('   Response:', webhookData.substring(0, 200) + (webhookData.length > 200 ? '...' : ''))
    console.log('')
  } catch (error) {
    console.error('   Error:', error)
    console.log('')
  }
  
  // Test 4: Test webhook with POST (without auth - should fail)
  try {
    console.log('4. Testing /api/mqtt/webhook (POST without auth - should fail)')
    const webhookTestResponse = await fetch(`${baseUrl}/api/mqtt/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'sensors/test/data',
        payload: JSON.stringify({
          sensor_id: 'test',
          pm2_5: 25.5,
          pm10: 45.2,
          temperature: 22.3,
          humidity: 60.1
        })
      })
    })
    console.log('   Status:', webhookTestResponse.status)
    const webhookTestData = await webhookTestResponse.text()
    console.log('   Response:', webhookTestData.substring(0, 200) + (webhookTestData.length > 200 ? '...' : ''))
    console.log('')
  } catch (error) {
    console.error('   Error:', error)
    console.log('')
  }
  
  console.log('✅ Production endpoint tests completed')
}

testProductionEndpoints().catch(console.error) 