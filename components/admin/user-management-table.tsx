"use client"

"use client"

import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, Shield, User, CheckCircle, XCircle, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface UserManagementTableProps {
  onPendingCountChange?: (count: number) => void;
}

export default function UserManagementTable({ onPendingCountChange }: UserManagementTableProps) {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await getAllUsers();
        const pending = fetchedUsers.filter(u => !u.isApproved).sort((a, b) => a.email.localeCompare(b.email));
        const approved = fetchedUsers.filter(u => u.isApproved).sort((a, b) => a.email.localeCompare(b.email));
        setPendingUsers(pending);
        setApprovedUsers(approved);
        setError(null);
      } catch (err) {
        setError('Erreur lors de la récupération des utilisateurs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingUsers.length);
    }
  }, [pendingUsers, onPendingCountChange]);

  const handleRoleChange = async (uid: string, role: 'admin' | 'consultant') => {
    try {
      await updateUserProfile(uid, { role });
      setApprovedUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      setPendingUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      toast({ title: 'Succès', description: 'Le rôle a été mis à jour.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le rôle.' });
    }
  };

  const handleApprovalChange = async (uid: string, isApproved: boolean) => {
    try {
      // Optimistically update UI first for better UX
      const userToMove = [...pendingUsers, ...approvedUsers].find(u => u.uid === uid);
      if (userToMove) {
        if (isApproved) {
          setPendingUsers(prev => prev.filter(u => u.uid !== uid));
          setApprovedUsers(prev => [...prev, { ...userToMove, isApproved: true }].sort((a, b) => a.email.localeCompare(b.email)));
        } else {
          setApprovedUsers(prev => prev.filter(u => u.uid !== uid));
          setPendingUsers(prev => [...prev, { ...userToMove, isApproved: false }].sort((a, b) => a.email.localeCompare(b.email)));
        }
      }

      if (isApproved) {
        // On approval, call the Cloud Function to handle backend logic
        const functions = getFunctions();
        const approveUser = httpsCallable(functions, 'approveUserAndSendVerificationEmail');
        await approveUser({ uid });
        toast({ title: 'Utilisateur Approuvé', description: "L'email de vérification a été envoyé." });
      } else {
        // On disapproval, just update the profile directly
        await updateUserProfile(uid, { isApproved: false });
        toast({ title: 'Statut mis à jour', description: "La demande a été marquée comme non approuvée." });
      }

    } catch (error) {
      console.error("Error handling approval change:", error);
      toast({ variant: 'destructive', title: 'Erreur', description: "Une erreur est survenue lors de la mise à jour du statut." });
      // Revert UI changes on error
      // This part can be complex, for now we log the error and show a toast
    }
  };

  const handleResetVerification = async (uid: string) => {
    try {
      const functions = getFunctions();
      const resetVerification = httpsCallable(functions, 'resetVerificationStatus');
      await resetVerification({ uid });

      setApprovedUsers(prev => prev.map(u => u.uid === uid ? { ...u, emailVerified: false } : u));

      toast({
        title: 'Vérification réinitialisée',
        description: "Le statut de vérification de l'utilisateur a été réinitialisé. Demandez-lui de se reconnecter pour recevoir un nouvel email.",
      });
    } catch (error) {
      console.error('Error resetting verification:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de réinitialiser la vérification.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const functions = getFunctions();
      const deleteUserCallable = httpsCallable(functions, 'deleteUser');
      await deleteUserCallable({ uid: userToDelete.uid });

      // If successful, update UI state
      setPendingUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
      setApprovedUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
      
      toast({
        title: 'Succès',
        description: `L'utilisateur ${userToDelete.email} a été supprimé.`
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur. Vérifiez la console pour plus de détails.'
      });
    } finally {
      setUserToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const renderUserTable = (userList: UserProfile[], title: string) => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisateur</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Raison de la demande</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rôle</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {userList.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName || 'N/A'}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={user.accessReason}>
                  {user.accessReason || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select value={user.role} onValueChange={(value: 'admin' | 'consultant') => handleRoleChange(user.uid, value)}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin"><Shield className="h-4 w-4 mr-2 inline"/> Admin</SelectItem>
                      <SelectItem value="consultant"><User className="h-4 w-4 mr-2 inline"/> Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {user.isApproved ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    <Switch checked={user.isApproved} onCheckedChange={(checked) => handleApprovalChange(user.uid, checked)} aria-label="Statut d'approbation" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {user.isApproved ? (
                      <>
                        {!user.emailVerified && (
                          <Button variant="ghost" size="icon" title="Réinitialiser la vérification" onClick={() => handleResetVerification(user.uid)}>
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="sr-only">Réinitialiser la vérification</span>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Supprimer" onClick={() => setUserToDelete(user)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" title="Refuser" onClick={() => setUserToDelete(user)}>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Refuser</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 ? (
        renderUserTable(pendingUsers, `Demandes d'approbation (${pendingUsers.length})`)
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucune nouvelle demande d'approbation.</p>
        </div>
      )}
      {renderUserTable(approvedUsers, 'Utilisateurs actifs')}

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle va {
                userToDelete?.isApproved 
                  ? `supprimer définitivement le compte de ` 
                  : `refuser la demande et supprimer le compte de `
              }
              <strong>{userToDelete?.displayName || userToDelete?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Oui, supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
