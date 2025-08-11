"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MailCheck, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { authStatus, user, sendVerificationEmail, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated' || authStatus === 'admin') {
      router.push('/dashboard');
    }
  }, [authStatus, router]);

  const handleResendEmail = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "Email Envoyé",
        description: "Un nouvel email de vérification a été envoyé.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email. Veuillez réessayer.",
      });
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre adresse e-mail</CardTitle>
          <CardDescription>
            Un email de vérification a été envoyé à <br />
            <strong className="font-semibold text-gray-800 dark:text-gray-200">
              {user?.email || 'votre adresse'}
            </strong>.
            <br />
            Veuillez cliquer sur le lien pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleResendEmail} disabled={isSending} className="w-full">
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Renvoyer l'email de vérification"
            )}
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Se déconnecter
          </Button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Vous ne trouvez pas l'email ? Pensez à vérifier votre dossier de courrier indésirable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
