import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

const firebaseAdminConfig = {
  // Try multiple sources for projectId (prod on GCP exposes GOOGLE_CLOUD_PROJECT / FIREBASE_CONFIG)
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || process.env.FIREBASE_PROJECT_ID
    || process.env.GOOGLE_CLOUD_PROJECT
    || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  privateKey: (process.env.FIREBASE_PRIVATE_KEY
    // Normalize common newline encodings and strip surrounding quotes if any
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').replace(/^"|"$/g, '')
    : ""),
}

function createFirebaseAdminApp() {
  const apps = getApps()
  
  if (apps.length > 0) {
    console.log("Firebase Admin SDK already initialized.")
    return apps[0]
  }

  console.log("Attempting to initialize Firebase Admin SDK...")

  // Prefer explicit Service Account credentials when provided via env
  if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
    console.log("Initializing Firebase Admin with explicit service account credentials.")
    try {
      return initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: firebaseAdminConfig.projectId,
      })
    } catch (error) {
      console.error("ERROR: Failed to initialize Firebase Admin with explicit credentials.", error)
      // Do not fall back, as the presence of variables implies an intent that should not fail silently.
      return null
    }
  }
  
  // Otherwise, fall back to ADC (Application Default Credentials) on Google environments
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_CONFIG || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log("Explicit credentials not found, falling back to Application Default Credentials (ADC).")
    try {
      return initializeApp()
    } catch(error) {
      console.error("ERROR: Failed to initialize Firebase Admin with ADC.", error)
      return null
    }
  }
  
  console.error("CRITICAL: Firebase Admin SDK initialization failed. No credentials provided or found.")
  return null
}

const firebaseAdmin = createFirebaseAdminApp()

export const adminAuth = firebaseAdmin ? getAuth(firebaseAdmin) : null
export const adminDb = firebaseAdmin ? getFirestore(firebaseAdmin) : null

export default firebaseAdmin