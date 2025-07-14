"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function RequestAccessPage() {
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { requestAccess } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email.trim() || !reason.trim()) {
      setError("L'email et la raison de la demande sont requis.")
      setLoading(false)
      return
    }

    try {
      await requestAccess(email, reason)
      setIsSubmitted(true)
    } catch (err: any) {
      console.error("Request access error:", err)
      setError(err.message || "Une erreur est survenue lors de l'envoi de la demande.")
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              Demande envoyée !
            </CardTitle>
            <CardDescription>
              Votre demande a été soumise avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Vous recevrez un email une fois que votre demande aura été examinée par un administrateur.
            </p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Retour à la connexion
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
            Remplissez le formulaire pour soumettre votre demande.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de la demande</Label>
              <Textarea
                id="reason"
                placeholder="Expliquez brièvement pourquoi vous avez besoin d'un accès (ex: je suis consultant pour la mairie de Cotonou)."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={loading}
                rows={4}
              />
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
                "Envoyer la demande"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
            >
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}