import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// Initialize Firebase only if config is available
let app: any
let auth: any
let db: any

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  // Create dummy objects for build time
  app = null
  auth = null
  db = null
}

// Export Firebase services
export { auth, db }

export default app 

// Type definition for user profiles
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant';
  isApproved: boolean;
  createdAt: Timestamp;
}

/**
 * Fetches all user profiles from the 'users' collection in Firestore.
 * @returns A promise that resolves to an array of user profiles.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserProfile));
    return usersList;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Updates a user's profile in Firestore.
 * @param uid The user's ID.
 * @param data An object containing the fields to update.
 */
export async function updateUserProfile(uid: string, data: Partial<Omit<UserProfile, 'uid'>>) {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not initialized");
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}