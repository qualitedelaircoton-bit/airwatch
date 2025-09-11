"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from '@/types';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";



export type AuthStatus = 'loading' | 'unauthenticated' | 'pending_approval' | 'pending_verification' | 'authenticated' | 'admin';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authStatus: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, accessReason: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile: UserProfile = {
          uid: uid,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          role: data.role || "consultant",
          isApproved: data.isApproved || false,
          createdAt: data.createdAt, // Keep as Firestore Timestamp
          updatedAt: data.updatedAt, // Keep as Firestore Timestamp
          emailVerified: data.emailVerified || false,
          accessReason: data.accessReason || "", // Add missing required field with a fallback
        };
        return profile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const createOrUpdateUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Ensure accessReason is present for new profiles, as it's required by the type.
      if (!additionalData.accessReason) {
        throw new Error("Access reason is required for new user profile creation.");
      }

      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || additionalData.displayName || null,
        photoURL: user.photoURL || additionalData.photoURL || null,
        role: additionalData.role || "consultant",
        isApproved: additionalData.isApproved || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        emailVerified: user.emailVerified,
        accessReason: additionalData.accessReason, // Explicitly set required field
        ...additionalData, // Spread the rest
      };
      await setDoc(userRef, { ...newUserProfile });
      return newUserProfile;
    } else {
      const updateData = {
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: new Date(),
        emailVerified: user.emailVerified, // Always sync email verification status
        ...additionalData,
      };
      await updateDoc(userRef, updateData);
      const profile = await fetchUserProfile(user.uid);
      if (!profile) throw new Error('Failed to fetch updated profile');
      return profile;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, accessReason: string): Promise<void> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Send email verification immediately
      await sendEmailVerification(result.user);
      // Create initial profile with access reason
      await createOrUpdateUserProfile(result.user, { displayName, accessReason });
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/auth/login'; // Redirect to login page after sign out
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    if (!user) throw new Error("No user authenticated");
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error("Resend verification error:", error);
      throw error;
    }
  };



  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      // Cleanup previous profile listener if any
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        profileUnsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: data.email,
              displayName: data.displayName || null,
              photoURL: data.photoURL || null,
              role: data.role || "consultant",
              isApproved: data.isApproved || false,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              emailVerified: firebaseUser.emailVerified, // Use live value from firebaseUser
              accessReason: data.accessReason || "",
            };
            setUserProfile(profile);

            if (!firebaseUser.emailVerified) {
              setAuthStatus('pending_verification');
            } else if (!profile.isApproved) {
              setAuthStatus('pending_approval');
            } else if (profile.role === 'admin') {
              setAuthStatus('admin');
            } else {
              setAuthStatus('authenticated');
            }
          } else {
            setUserProfile(null);
            setAuthStatus('unauthenticated');
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthStatus('unauthenticated');
        setLoading(false);
      }
    });

    return () => {
      if (profileUnsub) profileUnsub();
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    authStatus,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,

  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};