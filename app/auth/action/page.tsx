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
            setStatus('success');
            setMessage('Votre email a été vérifié avec succès ! Vous allez être redirigé.');
            setTimeout(() => router.push('/dashboard'), 3000);
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
          <p className="text-muted-foreground mb-6">{message}</p>
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
