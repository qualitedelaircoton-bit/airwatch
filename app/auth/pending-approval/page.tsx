"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, CheckCircle, RefreshCw, UserCheck, Mail } from "lucide-react";
import AuthLayout from '@/components/auth/auth-layout';
import { useAuth } from "@/contexts/auth-context"

export default function PendingApprovalPage() {
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  
  const { user, userProfile, signOut } = useAuth()
  const router = useRouter()

  // Vérifier le statut de l'utilisateur
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!user.emailVerified) {
      router.push("/auth/verify-email")
      return
    }

    if (userProfile && userProfile.isApproved) {
      router.push("/")
      return
    }
  }, [user, userProfile, router])

  // Vérifier automatiquement le statut d'approbation toutes les 30 secondes
  useEffect(() => {
    if (!user || !userProfile) return

    const interval = setInterval(async () => {
      try {
        await user.reload()
        // Le profil sera mis à jour automatiquement par le AuthContext
        setLastCheck(new Date())
      } catch (error) {
        console.error("Error checking approval status:", error)
      }
    }, 30000) // Vérifier toutes les 30 secondes

    return () => clearInterval(interval)
  }, [user, userProfile])

  const handleCheckStatus = async () => {
    if (!user) return

    setCheckingStatus(true)
    try {
      await user.reload()
      setLastCheck(new Date())
      
      // Attendre un peu pour laisser le temps au profil de se mettre à jour
      setTimeout(() => {
        if (userProfile && userProfile.isApproved) {
          router.push("/")
        }
      }, 1000)
    } catch (error) {
      console.error("Error checking status:", error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="En attente d'approbation"
      description="Votre compte est en cours de validation par un administrateur."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-12 w-12 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            En attente d'approbation
          </CardTitle>
          <CardDescription>
            Votre compte est en cours de validation par un administrateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Email vérifié :</strong> {user.email}
            </AlertDescription>
          </Alert>
          
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Statut actuel :</strong>
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
              <li>• Votre email a été vérifié avec succès</li>
              <li>• Votre compte est en attente d'approbation</li>
              <li>• Un administrateur examinera votre demande</li>
              <li>• Vous recevrez une notification par email</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Informations de votre profil :
              </p>
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Nom : {userProfile.displayName || "Non renseigné"}</li>
              <li>• Email : {userProfile.email}</li>
              <li>• Rôle demandé : {userProfile.role === "admin" ? "Administrateur" : "Consultant"}</li>
                            <li>• Créé le : {userProfile.createdAt.toDate().toLocaleDateString("fr-FR")}</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleCheckStatus}
              className="w-full"
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vérifier le statut
                </>
              )}
            </Button>
            
            {lastCheck && (
              <p className="text-xs text-gray-500 text-center">
                Dernière vérification : {lastCheck.toLocaleTimeString("fr-FR")}
              </p>
            )}
          </div>
          
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Patience requise :</strong> Le processus d'approbation peut prendre 
              24 à 48 heures selon la disponibilité des administrateurs.
            </AlertDescription>
          </Alert>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Besoin d'aide ou des questions ? Contactez un administrateur.
            </p>
            <Button
              onClick={signOut}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Se déconnecter
            </Button>
          </div>
          
          <div className="text-center">
            <Link
              href="/landing"
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
} 