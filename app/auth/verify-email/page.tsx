"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import AuthLayout from '@/components/auth/auth-layout';
import { useAuth } from "@/contexts/auth-context"

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [resendCount, setResendCount] = useState(0)
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(0)
  
  const { user, userProfile, sendVerificationEmail, signOut } = useAuth()
  const router = useRouter()

  // Vérifier le statut de l'utilisateur
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.emailVerified) {
      if (userProfile && userProfile.isApproved) {
        router.push("/dashboard")
      } else {
        router.push("/auth/pending-approval")
      }
    }
  }, [user, userProfile, router])

  // Countdown pour limiter les renvois d'email
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Vérifier automatiquement l'email toutes les 5 secondes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        await user.reload()
        if (user.emailVerified) {
          setMessage("Email vérifié avec succès ! Redirection...")
          setTimeout(() => {
            if (userProfile && userProfile.isApproved) {
              router.push("/dashboard")
            } else {
              router.push("/auth/pending-approval")
            }
          }, 2000)
        }
      } catch (error) {
        console.error("Error reloading user:", error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [user, router])

  const handleResendEmail = async () => {
    if (!user || !canResend) return

    setResendLoading(true)
    setError("")
    setMessage("")

    try {
      await sendVerificationEmail()
      setMessage("Email de vérification renvoyé avec succès ! Vérifiez votre boîte email.")
      setResendCount(prev => prev + 1)
      setCanResend(false)
      setCountdown(60) // Attendre 60 secondes avant de pouvoir renvoyer
    } catch (error: any) {
      console.error("Resend email error:", error)
      
      switch (error.code) {
        case "auth/too-many-requests":
          setError("Trop de demandes. Veuillez attendre avant de renvoyer l'email.")
          break
        case "auth/user-token-expired":
          setError("Session expirée. Veuillez vous reconnecter.")
          break
        default:
          setError("Erreur lors du renvoi de l'email. Veuillez réessayer.")
      }
    } finally {
      setResendLoading(false)
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

  const handleCheckEmail = async () => {
    if (!user) return

    setLoading(true)
    try {
      await user.reload()
      if (user.emailVerified) {
        setMessage("Email vérifié avec succès ! Redirection...")
        setTimeout(() => {
          router.push("/auth/pending-approval")
        }, 2000)
      } else {
        setError("Email non vérifié. Vérifiez votre boîte email et cliquez sur le lien.")
      }
    } catch (error) {
      console.error("Check email error:", error)
      setError("Erreur lors de la vérification. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }



  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Vérifiez votre email"
      description={`Un email de vérification a été envoyé à ${user.email}`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérifiez votre email
          </CardTitle>
          <CardDescription>
            Un email de vérification a été envoyé à :<br />
            <span className="font-semibold text-emerald-600">{user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Instructions :</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• Vérifiez votre boîte email (y compris les spams)</li>
              <li>• Cliquez sur le lien de vérification</li>
              <li>• Revenez sur cette page pour continuer</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleCheckEmail}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  J'ai vérifié mon email
                </>
              )}
            </Button>
            
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={resendLoading || !canResend}
            >
              {resendLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Renvoi en cours...
                </>
              ) : !canResend ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renvoyer dans {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renvoyer l'email
                </>
              )}
            </Button>
          </div>
          
          {resendCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Email renvoyé {resendCount} fois
            </p>
          )}
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Pas le bon email ? Vous pouvez vous déconnecter et créer un nouveau compte.
            </p>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Se déconnecter
            </Button>
          </div>
          
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
} 