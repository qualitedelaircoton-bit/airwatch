import { type NextRequest } from "next/server"

// Configuration CORS centralisée pour Vercel
export function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://www.airquality.africa',
    'https://airquality.africa',
    'http://localhost:3000',
    'http://localhost:3001'
  ]
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://www.airquality.africa',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// Fonction utilitaire pour créer une réponse OPTIONS
export function createOptionsResponse(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(request)
  })
}