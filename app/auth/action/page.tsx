"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification en cours...');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Paramètres de lien invalides ou manquants.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, actionCode);
            setVerifiedEmail(auth.currentUser?.email ?? null);
            setStatus('success');
            setMessage("Votre adresse e-mail a bien été vérifiée.");
            break;
          // Add other cases like 'resetPassword' or 'recoverEmail' here in the future
          default:
            throw new Error('Mode d\'action non supporté.');
        }
      } catch (error: any) {
        setStatus('error');
        if (error.code === 'auth/invalid-action-code') {
          setMessage('Le lien de vérification est invalide ou a expiré. Veuillez en demander un nouveau.');
        } else {
          setMessage(`Une erreur est survenue : ${error.message}`);
        }
      }
    };

    handleAction();
  }, [searchParams, router]);

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            {renderStatus()}
          </div>
          <CardTitle className="text-2xl">Vérification de l'Email</CardTitle>
        </CardHeader>
      <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">{message}</p>
          {status === 'success' && (
            <div className="space-y-4">
              {verifiedEmail && (
                <p className="text-sm text-muted-foreground">
                  Adresse vérifiée: <span className="font-medium text-foreground">{verifiedEmail}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Votre demande d'accès est en cours d'examen par un administrateur. Vous recevrez un e‑mail dès qu'elle sera approuvée.
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Revenir à la page d'accueil
              </Button>
            </div>
          )}
          {status === 'error' && (
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Retour à la page de connexion
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
            <AuthActionHandler />
        </Suspense>
    )
}
