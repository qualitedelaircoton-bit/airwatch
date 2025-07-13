"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(0)
  
  const { resetPassword, user } = useAuth()
  const router = useRouter()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Countdown pour limiter les renvois
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    if (!email.trim()) {
      setError("L'adresse email est requise.")
      setLoading(false)
      return
    }

    try {
      await resetPassword(email)
      setSuccess(true)
      setCanResend(false)
      setCountdown(60) // Attendre 60 secondes avant de pouvoir renvoyer
    } catch (error: any) {
      console.error("Reset password error:", error)
      
      // Messages d'erreur personnalisés
      switch (error.code) {
        case "auth/user-not-found":
          setError("Aucun compte trouvé avec cet email.")
          break
        case "auth/invalid-email":
          setError("Adresse email invalide.")
          break
        case "auth/too-many-requests":
          setError("Trop de tentatives. Veuillez attendre avant de réessayer.")
          break
        case "auth/network-request-failed":
          setError("Erreur de connexion. Vérifiez votre connexion Internet.")
          break
        default:
          setError("Une erreur est survenue. Veuillez réessayer.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || !email.trim()) return

    setLoading(true)
    setError("")

    try {
      await resetPassword(email)
      setSuccess(true)
      setCanResend(false)
      setCountdown(60)
    } catch (error: any) {
      console.error("Resend error:", error)
      setError("Erreur lors du renvoi. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              Email envoyé !
            </CardTitle>
            <CardDescription>
              Instructions envoyées à votre adresse email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Un email de réinitialisation a été envoyé à :<br />
                <span className="font-semibold text-emerald-600">{email}</span>
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Étapes suivantes :</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• Vérifiez votre boîte email (y compris les spams)</li>
                <li>• Cliquez sur le lien de réinitialisation</li>
                <li>• Créez un nouveau mot de passe</li>
                <li>• Reconnectez-vous avec le nouveau mot de passe</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
                disabled={loading || !canResend}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renvoi en cours...
                  </>
                ) : !canResend ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Renvoyer dans {countdown}s
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Renvoyer l'email
                  </>
                )}
              </Button>
              
              <Link href="/auth/login">
                <Button variant="default" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Mot de passe oublié
          </CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Entrez l'email associé à votre compte
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer le lien
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Note :</strong> Le lien de réinitialisation expire après 1 heure.
                Si vous ne recevez pas l'email, vérifiez votre dossier spam.
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link
                href="/auth/login"
                className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
              >
                Se connecter
              </Link>
            </div>
            
            <div className="text-center">
              <Link
                href="/landing"
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 