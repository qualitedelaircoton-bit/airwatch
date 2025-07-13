import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "",
}

function createFirebaseAdminApp() {
  const apps = getApps()
  
  if (apps.length > 0) {
    return apps[0]
  }

  // Only initialize if we have the required config
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