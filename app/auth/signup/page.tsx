"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Activity, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  const { signup, user, userProfile } = useAuth()
  const router = useRouter()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user && userProfile) {
      if (!user.emailVerified) {
        router.push("/auth/verify-email")
      } else if (!userProfile.isApproved) {
        router.push("/auth/pending-approval")
      } else {
        router.push("/")
      }
    }
  }, [user, userProfile, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      return "Le nom d'affichage est requis."
    }
    
    if (!formData.email.trim()) {
      return "L'email est requis."
    }
    
    if (formData.password.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères."
    }
    
    if (formData.password !== formData.confirmPassword) {
      return "Les mots de passe ne correspondent pas."
    }
    
    if (!acceptTerms) {
      return "Vous devez accepter les conditions d'utilisation."
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      await signup(formData.email, formData.password, formData.displayName)
      setSuccess(true)
      // Redirection automatique vers la page de vérification email
      setTimeout(() => {
        router.push("/auth/verify-email")
      }, 2000)
    } catch (error: any) {
      console.error("Signup error:", error)
      
      // Messages d'erreur personnalisés
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Un compte existe déjà avec cet email.")
          break
        case "auth/invalid-email":
          setError("Adresse email invalide.")
          break
        case "auth/weak-password":
          setError("Mot de passe trop faible. Utilisez au moins 6 caractères.")
          break
        case "auth/operation-not-allowed":
          setError("L'inscription par email/mot de passe n'est pas activée.")
          break
        default:
          setError("Une erreur est survenue lors de l'inscription.")
      }
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
              Inscription réussie !
            </CardTitle>
            <CardDescription>
              Un email de vérification a été envoyé à votre adresse.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Vérifiez votre boîte email et cliquez sur le lien de vérification.
              Une fois votre email vérifié, votre compte sera soumis à l'approbation d'un administrateur.
            </p>
            <Button
              onClick={() => router.push("/auth/verify-email")}
              className="w-full"
            >
              Continuer vers la vérification
            </Button>
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
            <Activity className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Demande d'accès
          </CardTitle>
          <CardDescription>
            Créez un compte pour accéder à AirWatch Bénin
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
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Votre nom complet"
                value={formData.displayName}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-sm">
                J'accepte les{" "}
                <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 underline">
                  conditions d'utilisation
                </Link>
              </Label>
            </div>
            
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Note :</strong> Votre compte sera soumis à l'approbation d'un administrateur 
                après la vérification de votre email. Vous recevrez une notification une fois approuvé.
              </AlertDescription>
            </Alert>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ?{" "}
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