"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import type { User } from "firebase/auth"
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

// Types
export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: "admin" | "consultant"
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  resendEmailVerification: () => Promise<void>
  requestAccess: (email: string, reason: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fonction pour récupérer le profil utilisateur depuis Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          id: uid,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          role: data.role || "consultant",
          isApproved: data.isApproved || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          emailVerified: data.emailVerified || false,
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  // Fonction pour créer/mettre à jour le profil utilisateur
  const createOrUpdateUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}) => {
    try {
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Créer un nouveau profil utilisateur
        const newUserProfile: Omit<UserProfile, 'id'> = {
          email: user.email || "",
          displayName: user.displayName || additionalData.displayName || null,
          photoURL: user.photoURL || additionalData.photoURL || null,
          role: additionalData.role || "consultant", // Par défaut consultant
          isApproved: additionalData.isApproved || false, // Requiert approbation admin
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: user.emailVerified,
          ...additionalData,
        }

        await setDoc(userRef, newUserProfile)
        return { id: user.uid, ...newUserProfile }
      } else {
        // Mettre à jour le profil existant
        const updateData = {
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          updatedAt: new Date(),
          ...additionalData,
        }

        await updateDoc(userRef, updateData)
        return await fetchUserProfile(user.uid)
      }
    } catch (error) {
      console.error("Error creating/updating user profile:", error)
      throw error
    }
  }

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchUserProfile(result.user.uid)
      setUserProfile(profile)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  // Fonction d'inscription
  const signup = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Mettre à jour le profil Firebase Auth
      await updateProfile(result.user, { displayName })
      
      // Envoyer l'email de vérification
      await sendEmailVerification(result.user)
      
      // Créer le profil Firestore
      const profile = await createOrUpdateUserProfile(result.user, { displayName })
      setUserProfile(profile)
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  // Fonction de réinitialisation du mot de passe
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Reset password error:", error)
      throw error
    }
  }

  // Fonction de mise à jour du profil utilisateur
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("No user authenticated")
    
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      })
      
      // Mettre à jour l'état local
      const updatedProfile = await fetchUserProfile(user.uid)
      setUserProfile(updatedProfile)
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  // Fonction pour renvoyer l'email de vérification
  const resendEmailVerification = async (): Promise<void> => {
    if (!user) throw new Error("No user authenticated")
    
    try {
      await sendEmailVerification(user)
    } catch (error) {
      console.error("Resend verification error:", error)
      throw error
    }
  }

  // Fonction pour demander un accès
  const requestAccess = async (email: string, reason: string): Promise<void> => {
    try {
      const accessRequestsCollection = collection(db, "accessRequests");
      await addDoc(accessRequestsCollection, {
        email,
        reason,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error submitting access request:", error);
      throw error;
    }
  };

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          const profile = await fetchUserProfile(firebaseUser.uid)
          if (profile) {
            setUserProfile(profile)
          } else {
            // Créer le profil s'il n'existe pas
            const newProfile = await createOrUpdateUserProfile(firebaseUser)
            setUserProfile(newProfile)
          }
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    resendEmailVerification,
    requestAccess,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 