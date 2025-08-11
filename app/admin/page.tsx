"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import UserManagementTable from '@/components/admin/user-management-table';

export default function AdminPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const router = useRouter()


  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'admin') {
      router.push('/') // Redirige les non-admins vers la page d'accueil
    }
  }, [userProfile, authLoading, router])

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (userProfile.role !== 'admin') {
    // Affiche un message pendant la redirection
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground">Redirection...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h2>
                    <p className="text-muted-foreground">Approuver, modifier ou supprimer des comptes existants.</p>
                </div>
              </div>
              <Link href="/dashboard" passHref>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Retour au tableau de bord</span>
                </Button>
              </Link>
            </div>
            <UserManagementTable />
          </div>
        </div>
      </div>
    </div>
  )
}
