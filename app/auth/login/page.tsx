"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import AuthLayout from '@/components/auth/auth-layout';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signIn, user, userProfile } = useAuth()
  const router = useRouter()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && userProfile) {
      if (!user.emailVerified) {
        router.push("/auth/verify-email")
      } else if (!userProfile.isApproved) {
        router.push("/auth/pending-approval")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, userProfile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signIn(email, password)
      // La redirection se fait automatiquement via useEffect
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Messages d'erreur personnalisés
      switch (error.code) {
        case "auth/user-not-found":
          setError("Aucun compte trouvé avec cet email.")
          break
        case "auth/wrong-password":
          setError("Mot de passe incorrect.")
          break
        case "auth/invalid-email":
          setError("Adresse email invalide.")
          break
        case "auth/user-disabled":
          setError("Ce compte a été désactivé.")
          break
        case "auth/too-many-requests":
          setError("Trop de tentatives de connexion. Veuillez réessayer plus tard.")
          break
        default:
          setError("Une erreur est survenue lors de la connexion.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Connexion à votre compte"
      description="Entrez vos identifiants pour accéder à la plateforme."
    >
      <div className="flex items-center justify-center">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Activity className="h-12 w-12 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Connexion
            </CardTitle>
            <CardDescription>
              Accédez à votre tableau de bord AirWatch Bénin
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
                <Label htmlFor="email">Email</Label>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
            
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Pas encore de compte ?{" "}
                <Link
                  href="/auth/signup"
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                >
                  Demander l'accès
                </Link>
              </div>
              
              <div className="text-center">
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                >
                  ← Retour à l'accueil
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </AuthLayout>
  )
} 