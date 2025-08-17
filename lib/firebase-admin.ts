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
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
}

function createFirebaseAdminApp() {
  const apps = getApps()
  
  if (apps.length > 0) {
    return apps[0]
  }

  // Prefer ADC (Application Default Credentials) on Google environments (Firebase Hosting/Functions)
  // If GOOGLE_CLOUD_PROJECT or FIREBASE_CONFIG is present, initialize with default credentials
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_CONFIG) {
    return initializeApp()
  }

  // Fallback for local/dev: initialize with service account env vars if provided
  if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
    return initializeApp({
      credential: cert(firebaseAdminConfig),
      projectId: firebaseAdminConfig.projectId,
    })
  }
  
  return null
}

const firebaseAdmin = createFirebaseAdminApp()

export const adminAuth = firebaseAdmin ? getAuth(firebaseAdmin) : null
export const adminDb = firebaseAdmin ? getFirestore(firebaseAdmin) : null

export default firebaseAdmin