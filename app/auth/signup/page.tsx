
"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import AuthLayout from '@/components/auth/auth-layout';
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accessReason, setAccessReason] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!displayName.trim() || !email.trim() || !password.trim() || !accessReason.trim() || !phoneNumber.trim()) {
      setError("Tous les champs sont requis.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      setLoading(false)
      return
    }

    // Basic phone format validation (accepts +, spaces, dashes and digits, 8-20 chars total)
    const phoneNormalized = phoneNumber.replace(/[^+\d]/g, "");
    if (!/^\+?\d{8,20}$/.test(phoneNormalized)) {
      setError("Le numéro de téléphone n'est pas valide. Utilisez un format international, ex: +229XXXXXXXX.")
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, displayName, accessReason, phoneNumber)
      // Create the access request server-side with authenticated token
      const idToken = await auth?.currentUser?.getIdToken();
      if (idToken) {
        try {
          await fetch('/api/access-requests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ reason: accessReason, phone: phoneNumber }),
          });
        } catch (e) {
          // Non-blocking: the admin will see the profile anyway
          console.error('Failed to create access request', e);
        }
      }
      router.push('/auth/verify-email');
    } catch (err: any) {
      console.error("Sign up error:", err)
      if (err.code === 'auth/email-already-in-use') {
        setError("Cette adresse email est déjà utilisée.")
      } else {
        setError(err.message || "Une erreur est survenue lors de la création du compte.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      description="Remplissez le formulaire pour demander l'accès à la plateforme."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-10 w-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Créer un compte
          </CardTitle>
          <CardDescription>
            Votre compte sera soumis à l'approbation d'un administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom complet</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +229 01 61 23 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessReason">Raison de la demande d'accès</Label>
              <Textarea
                id="accessReason"
                placeholder="Décrivez brièvement pourquoi vous avez besoin d'un accès..."
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                required
                disabled={loading}
                className="min-h-[100px]"
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
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte?{" "}
            <Link href="/auth/login" className="underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}