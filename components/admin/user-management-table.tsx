"use client"

import { useState, useEffect } from 'react'
import { getAllUsers, updateUserProfile, type UserProfile } from '@/lib/firebase'
import { Loader2, Shield, User, CheckCircle, XCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface UserManagementTableProps {
  onPendingCountChange?: (count: number) => void;
}

export default function UserManagementTable({ onPendingCountChange }: UserManagementTableProps) {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([])
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingUsers.length);
    }
  }, [pendingUsers, onPendingCountChange]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const fetchedUsers = await getAllUsers();
        const pending = fetchedUsers.filter(u => !u.isApproved).sort((a, b) => a.email.localeCompare(b.email));
        const approved = fetchedUsers.filter(u => u.isApproved).sort((a, b) => a.email.localeCompare(b.email));
        setPendingUsers(pending);
        setApprovedUsers(approved);
        setError(null)
      } catch (err) {
        setError('Erreur lors de la récupération des utilisateurs.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleRoleChange = async (uid: string, role: 'admin' | 'consultant') => {
    try {
      await updateUserProfile(uid, { role })
      // Mettre à jour la bonne liste
      setApprovedUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
      setPendingUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
      toast({ title: 'Succès', description: 'Le rôle a été mis à jour.' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le rôle.' })
    }
  }

  const handleApprovalChange = async (uid: string, isApproved: boolean) => {
    try {
      await updateUserProfile(uid, { isApproved });
      // Déplacer l'utilisateur entre les listes
      const userToMove = [...pendingUsers, ...approvedUsers].find(u => u.uid === uid);
      if (userToMove) {
        if (isApproved) {
          setPendingUsers(prev => prev.filter(u => u.uid !== uid));
          setApprovedUsers(prev => [...prev, { ...userToMove, isApproved }].sort((a, b) => a.email.localeCompare(b.email)));
        } else {
          setApprovedUsers(prev => prev.filter(u => u.uid !== uid));
          setPendingUsers(prev => [...prev, { ...userToMove, isApproved }].sort((a, b) => a.email.localeCompare(b.email)));
        }
      }
      toast({ title: 'Succès', description: 'Le statut a été mis à jour.' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>
  }

  const renderUserTable = (userList: UserProfile[], title: string) => {
    if (userList.length === 0) {
      return null; // Ne rien afficher si la liste est vide pour le moment
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">{title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisateur</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rôle</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {userList.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select value={user.role} onValueChange={(value: 'admin' | 'consultant') => handleRoleChange(user.uid, value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin"><Shield className="h-4 w-4 mr-2 inline"/> Admin</SelectItem>
                        <SelectItem value="consultant"><User className="h-4 w-4 mr-2 inline"/> Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                          {user.isApproved 
                              ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                              : <XCircle className="h-5 w-5 text-red-500" />
                          }
                          <Switch
                              checked={user.isApproved}
                              onCheckedChange={(checked) => handleApprovalChange(user.uid, checked)}
                              aria-label="Statut d'approbation"
                          />
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
    </div>
  );
}
