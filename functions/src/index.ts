import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Callable function to approve an access request.
 * Creates a new user in Firebase Auth and a user profile in Firestore.
 */
export const approveAccessRequest = onCall(async (request) => {
  const { data, auth } = request;

  // 1. Check for authentication and admin role
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const adminUid = auth.uid;
  const adminUserDoc = await admin.firestore().collection("users").doc(adminUid).get();
  const adminProfile = adminUserDoc.data();

  if (adminProfile?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "The function must be called by an admin user."
    );
  }

  // 2. Get data from the client
  const { email, requestId } = data;
  if (!email || !requestId) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with an 'email' and 'requestId' argument."
    );
  }

  try {
    // 3. Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({ email });

    // 4. Create the user profile in Firestore
    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      role: "consultant",
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
    };
    await admin.firestore().collection("users").doc(userRecord.uid).set(userProfile);

    // 5. Update the access request status to 'approved'
    await admin.firestore().collection("accessRequests").doc(requestId).update({
      status: "approved",
      approvedBy: adminUid,
      approvedAt: new Date(),
    });

    // 6. (Optional) Send a welcome email or password reset link
    // For security, it's better to send a password reset link than a password.
    const passwordResetLink = await admin.auth().generatePasswordResetLink(email);
    // Here you would use a service like SendGrid, Mailgun, etc. to send the email.
    // For now, we'll just log it.
    console.log(`Password reset link for ${email}: ${passwordResetLink}`);

    return { success: true, message: `User ${email} created successfully.` };
  } catch (error) {
    console.error("Error approving access request:", error);
    throw new HttpsError(
      "internal",
      "An internal error occurred while creating the user.",
      error
    );
  }
});
