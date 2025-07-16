"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const { authStatus, user, sendVerificationEmail, signOut } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authStatus === 'authenticated' || authStatus === 'admin') {
      router.push('/');
    }
  }, [authStatus, router]);

  const handleResendEmail = async () => {
    try {
      await sendVerificationEmail();
      setMessage("Un nouvel email de vérification a été envoyé.");
    } catch (error) {
      setMessage("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Vérifiez votre adresse e-mail</h2>
          <p className="mt-2 text-sm text-gray-600">
            Un email de vérification a été envoyé à <strong>{user?.email}</strong>. Veuillez cliquer sur le lien dans l'email pour activer votre compte.
          </p>
        </div>
        <div className="mt-5">
          <button
            onClick={handleResendEmail}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Renvoyer l'email de vérification
          </button>
          {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
        </div>
        <button
          onClick={() => signOut().then(() => router.push('/login'))}
          className="mt-4 group relative flex w-full justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
