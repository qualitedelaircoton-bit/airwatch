import React from 'react';
import { Activity } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-200">
            <Activity className="h-8 w-8 text-emerald-600" />
            <span>AirWatch</span>
          </Link>
        </div>
        <main>{children}</main>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} AirWatch Bénin. Tous droits réservés.</p>
        <p className="mt-1">
          Une initiative pour un air plus sain.
        </p>
      </footer>
    </div>
  );
}
