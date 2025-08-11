"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingApprovalPage() {
  const { authStatus, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'authenticated' || authStatus === 'admin') {
      router.push('/');
    }
  }, [authStatus, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Votre demande est en cours d'examen</h2>
          <p className="mt-2 text-sm text-gray-600">
            Merci pour votre inscription. Un administrateur examinera votre demande d'accès prochainement.
            Vous recevrez un email une fois votre compte approuvé.
          </p>
        </div>
        <button
          onClick={signOut}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Revenir à la page d'accueil
        </button>
      </div>
    </div>
  );
}
