"use client";

import { useAuth, type AuthStatus } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AuthStatus[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = ['authenticated', 'admin'] }) => {
  const { authStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'loading') {
      return; // Attendre la fin du chargement
    }

    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (authStatus === 'pending_approval') {
      router.push('/pending-approval');
      return;
    }

    if (authStatus === 'pending_verification') {
      router.push('/verify-email');
      return;
    }

    if (!allowedRoles.includes(authStatus)) {
      router.push('/'); // Ou une page 'non autorisé'
    }
  }, [authStatus, router, allowedRoles]);

  if (authStatus === 'loading' || !allowedRoles.includes(authStatus)) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
