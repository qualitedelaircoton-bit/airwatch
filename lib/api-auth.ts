import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { NextRequest, NextResponse } from 'next/server'

export interface AuthenticatedRequest extends NextRequest {
  userId?: string
  userRole?: 'admin' | 'consultant'
  isApproved?: boolean
}

/**
 * Middleware d'authentification pour les routes API
 * Vérifie le token Firebase et les permissions utilisateur
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  isAuthenticated: boolean
  response?: NextResponse
  userId?: string
  userRole?: 'admin' | 'consultant'
  isApproved?: boolean
}> {
  try {
    if (!adminAuth || !adminDb) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        )
      }
    }

    // Extraire le token Bearer
    const authHeader = request.headers.get('authorization') || ""
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!idToken) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    }

    // Vérifier le token Firebase
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }
    }

    const userId = decodedToken.uid

    // Récupérer le profil utilisateur
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
    }

    const userData = userDoc.data()
    const isApproved = Boolean(userData?.isApproved)
    const userRole = userData?.role || 'consultant'

    // Vérifier que l'utilisateur est approuvé
    if (!isApproved) {
      return {
        isAuthenticated: false,
        response: NextResponse.json(
          { error: "Forbidden - Account not approved" },
          { status: 403 }
        )
      }
    }

    return {
      isAuthenticated: true,
      userId,
      userRole,
      isApproved
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      isAuthenticated: false,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware pour vérifier les permissions admin
 */
export async function requireAdmin(request: NextRequest): Promise<{
  isAuthorized: boolean
  response?: NextResponse
  userId?: string
}> {
  const authResult = await authenticateRequest(request)
  
  if (!authResult.isAuthenticated) {
    return {
      isAuthorized: false,
      response: authResult.response!
    }
  }

  if (authResult.userRole !== 'admin') {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
  }

  return {
    isAuthorized: true,
    userId: authResult.userId!
  }
}

/**
 * Wrapper pour protéger les routes API avec authentification
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.isAuthenticated) {
      return authResult.response!
    }

    // Ajouter les infos d'auth à la requête
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.userId = authResult.userId!
    authenticatedRequest.userRole = authResult.userRole!
    authenticatedRequest.isApproved = authResult.isApproved!

    return handler(authenticatedRequest, ...args)
  }
}

/**
 * Wrapper pour protéger les routes API avec permissions admin
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await requireAdmin(request)
    
    if (!authResult.isAuthorized) {
      return authResult.response!
    }

    // Ajouter les infos d'auth à la requête
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.userId = authResult.userId!
    authenticatedRequest.userRole = 'admin'
    authenticatedRequest.isApproved = true

    return handler(authenticatedRequest, ...args)
  }
}
