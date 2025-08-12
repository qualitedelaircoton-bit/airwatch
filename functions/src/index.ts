import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { calculateSensorStatus, updateAllSensorStatuses } from "./lib/firestore-status-calculator";
import { transformDeviceData, validateSensorData } from "./lib/shared-data-handler";
import * as admin from "firebase-admin";
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const mqttWebhookSecret = defineSecret('MQTT_WEBHOOK_SECRET');



/**
 * Scheduled function to update sensor statuses and create alerts for faulty sensors.
 */
export const scheduledSensorStatusUpdate = onSchedule({
  schedule: "every 15 minutes",
  timeZone: "Europe/Paris",
}, async (event) => {
  logger.info("⏰ Running scheduled sensor status update and alert check...");
  const adminDb = admin.firestore();

  try {
    // 1. Update statuses for all sensors
    await updateAllSensorStatuses();
    logger.info("✅ Sensor statuses updated.");

    // 2. Check for faulty sensors and create notifications
    const sensorsSnapshot = await adminDb.collection("sensors").get();
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);

    for (const doc of sensorsSnapshot.docs) {
      const sensor = doc.data();
      if (sensor.status === "ORANGE" || sensor.status === "RED") {
        // Check for recent existing notifications for this sensor to avoid spam
        const recentNotifs = await adminDb.collection("admin_notifications")
          .where("type", "==", "sensor_alert")
          .where("metadata.sensorId", "==", doc.id)
          .where("createdAt", ">", twentyFourHoursAgo)
          .limit(1)
          .get();

        if (recentNotifs.empty) {
          const notificationRef = adminDb.collection("admin_notifications").doc();
          const message = sensor.status === "RED" ? 
            `Alerte : Le capteur '${sensor.name}' est hors ligne.` :
            `Attention : Le capteur '${sensor.name}' a des retards de communication.`;

          const newNotification = {
            id: notificationRef.id,
            type: 'sensor_alert' as const,
            message,
            read: false,
            createdAt: now,
            link: `/admin/sensors/${doc.id}`,
            metadata: {
              sensorId: doc.id,
              sensorName: sensor.name,
              status: sensor.status
            }
          };

          await notificationRef.set(newNotification);
          logger.warn(`🚨 Created alert for sensor ${sensor.name} (ID: ${doc.id}) with status ${sensor.status}.`);
        }
      }
    }
    logger.info("✅ Faulty sensor check completed.");

  } catch (error) {
    logger.error("❌ Error running scheduled sensor status update and alert check:", error);
  }
});

// Firestore trigger to create a notification on new user creation for approval
export const createNotificationOnNewUser = onDocumentCreated("users/{userId}", async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const userData = snapshot.data();
  const userId = event.params.userId;

  // Only create a notification if the user is not approved
  if (userData.isApproved === false) {
    const email = userData.email;
    const displayName = userData.displayName || 'N/A';

    const notificationRef = admin.firestore().collection("admin_notifications").doc();

    const newNotification = {
      id: notificationRef.id,
      type: 'new_user' as const,
      message: `Nouvel utilisateur : ${displayName} (${email}) demande l'accès.`,
      read: false,
      createdAt: admin.firestore.Timestamp.now(),
      link: `/admin?userId=${userId}`
    };

    logger.info(`Creating notification for new user awaiting approval: ${email}`);

    await notificationRef.set(newNotification);
  } else {
    logger.info(`User ${userData.email} created as already approved, no notification needed.`);
  }
});



export const mqttWebhook = onRequest({ cors: true, secrets: [mqttWebhookSecret] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    logger.info(" Webhook MQTT reçu", { body: req.body });
    logger.info("📡 Webhook MQTT reçu", { body: req.body });

    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${mqttWebhookSecret.value()}`) {
      logger.warn("Unauthorized webhook access attempt");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body;
    const topicMatch = body.topic.match(/^sensors\/([^/]+)\/data$/);
    if (!topicMatch) {
      logger.warn("Invalid topic format", { topic: body.topic });
      res.status(400).json({ error: "Invalid topic format" });
      return;
    }

    const sensorId = topicMatch[1]!;
    const sensorRef = admin.firestore().collection("sensors").doc(sensorId);
    const sensorSnap = await sensorRef.get();

    if (!sensorSnap.exists) {
      logger.warn("Unknown sensor", { sensorId });
      res.status(404).json({ error: "Unknown sensor" });
      return;
    }
    const sensor = sensorSnap.data()!;

    let rawData;
    try {
      rawData = JSON.parse(body.payload);
    } catch (error) {
      logger.warn("Invalid JSON payload", { payload: body.payload, error });
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    const transformedData = transformDeviceData(rawData, sensorId);

    if (!transformedData || !validateSensorData(transformedData)) {
      logger.warn("Invalid or incomplete sensor data", { sensorId, payload: body.payload });
      res.status(400).json({ error: "Invalid or incomplete sensor data" });
      return;
    }

    // Convert the ISO string timestamp from shared function to Firestore Timestamp
    const firestoreTimestamp = admin.firestore.Timestamp.fromDate(new Date(transformedData.timestamp));

    const dataToSave = {
      ...transformedData,
      timestamp: firestoreTimestamp,
      rawData: body.payload, // Store the original raw payload string
    };

    const dataCollectionRef = admin.firestore().collection(`sensors/${sensorId}/data`);
    const savedRef = await dataCollectionRef.add(dataToSave);

    const newStatus = await calculateSensorStatus(sensorId);

    await sensorRef.update({
      status: newStatus,
      lastSeen: admin.firestore.Timestamp.now(),
      isActive: true,
    });

    logger.info(`✅ Données reçues et traitées pour le capteur ${sensor.name}`, { sensorId });

    res.status(200).json({
      success: true,
      message: `Données reçues pour ${sensor.name}`,
      dataId: savedRef.id,
      status: newStatus,
    });

  } catch (error) {
    logger.error("❌ Erreur traitement webhook:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Callable function to delete a user.
 * Deletes the user from Firebase Auth and their profile from Firestore.
 */
export const deleteUser = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  const { data, auth } = request;

  // 1. Check for authentication and admin role
  if (!auth) {
    throw new HttpsError(

      "unauthenticated",
      "Vous devez être connecté pour effectuer cette action."
    );
  }

  const callerUid = auth.uid;
  const callerSnap = await admin.firestore().collection("users").doc(callerUid).get();
  const callerProfile = callerSnap.data();

  if (callerProfile?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Vous n'avez pas les droits pour supprimer un utilisateur."
    );
  }

  // 2. Get UID to delete from the client
  const { uid: uidToDelete } = data;
  if (!uidToDelete || typeof uidToDelete !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Le UID de l\'utilisateur à supprimer est manquant ou invalide.'
    );
  }

  try {
    // 1. Delete from Firebase Authentication
    await admin.auth().deleteUser(uidToDelete);

    // 2. Delete from Firestore
    const userRef = admin.firestore().collection("users").doc(uidToDelete);
    const userSnap = await userRef.get();
    const userData = (userSnap.data() || {}) as any;
    const userEmail = userData.email as string | undefined;
    const wasApproved = Boolean(userData.isApproved);
    await userRef.delete();

    // 3. Send rejection/closure email if email known
    if (userEmail) {
      const subject = wasApproved
        ? "Votre compte a été supprimé"
        : "Votre demande d'accès a été refusée";
      const text = wasApproved
        ? `Bonjour,\n\nVotre compte a été supprimé suite au non-respect des règles d'utilisation.\nPour toute question, vous pouvez répondre à cet e‑mail.`
        : `Bonjour,\n\nVotre demande d'accès à la plateforme a été refusée par un administrateur.\nSi vous pensez qu'il s'agit d'une erreur, répondez à cet e‑mail.`;
      const html = wasApproved
        ? `
        <p>Bonjour,</p>
        <p>Votre compte a été supprimé suite au non-respect des règles d'utilisation.</p>
        <p>Pour toute question, vous pouvez répondre à cet e‑mail.</p>
      `
        : `
        <p>Bonjour,</p>
        <p>Votre demande d'accès à la plateforme a été refusée par un administrateur.</p>
        <p>Si vous pensez qu'il s'agit d'une erreur, répondez à cet e‑mail.</p>
      `;
      await admin.firestore().collection("mail").add({
        to: userEmail,
        message: { subject, text, html },
      });
    }

    logger.info(`Admin ${callerUid} deleted user ${uidToDelete}`);
    return { success: true, message: "L'utilisateur a été supprimé avec succès." };

  } catch (error) {
    logger.error(`Error deleting user ${uidToDelete} by admin ${callerUid}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "Une erreur interne est survenue lors de la suppression de l'utilisateur.",
      error
    );
  }
});

/**
 * Callable function to reset a user's email verification status.
 * Only callable by an admin.
 */
export const resetVerificationStatus = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  const { data, auth } = request;

  // 1. Check for authentication and admin role
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "Vous devez être connecté pour effectuer cette action."
    );
  }

  const callerUid = auth.uid;
  const callerSnap = await admin.firestore().collection("users").doc(callerUid).get();
  const callerProfile = callerSnap.data();

  if (callerProfile?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Vous n'avez pas les droits pour effectuer cette action."
    );
  }

  // 2. Get UID to reset from the client
  const { uid: uidToReset } = data;
  if (!uidToReset || typeof uidToReset !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Le UID de l\'utilisateur est manquant ou invalide.'
    );
  }

  try {
    // 3. Update Firebase Authentication
    await admin.auth().updateUser(uidToReset, { emailVerified: false });

    // 4. Update Firestore
    await admin.firestore().collection("users").doc(uidToReset).update({ emailVerified: false });

    logger.info(`Admin ${callerUid} reset verification for user ${uidToReset}`);
    return { success: true, message: "Le statut de vérification de l'utilisateur a été réinitialisé." };

  } catch (error) {
    logger.error(`Error resetting verification for user ${uidToReset} by admin ${callerUid}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "Une erreur interne est survenue lors de la réinitialisation.",
      error
    );
  }
});

/**
 * Approves a user and triggers the verification email.
 * - Sets isApproved to true in Firestore.
 * - Creates a document in the 'mail' collection to be sent by the Trigger Email extension.
 */
export const approveUserAndSendVerificationEmail = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  const { data, auth } = request;

  // 1. Check for authentication and admin role
  if (!auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const callerSnap = await admin.firestore().collection("users").doc(auth.uid).get();
  if (callerSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required.");
  }

  // 2. Validate UID input
  const { uid } = data;
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'User UID is missing or invalid.');
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    const userEmail = userRecord.email;

    if (!userEmail) {
      throw new HttpsError("not-found", "User email not found.");
    }

  // 3. Update user profile in Firestore
    const userDocRef = admin.firestore().collection("users").doc(uid);
    await userDocRef.update({ isApproved: true, updatedAt: admin.firestore.Timestamp.now() });

    // 4. Generate verification link that points to our custom action handler
    // Use a Firebase Auth authorized domain to avoid "Domain not allowlisted" errors
    const actionCodeSettings = {
      url: "https://airwatch-benin.web.app/auth/action",
      handleCodeInApp: false,
    };
    // Generate verification link (kept for potential future use, not sent now)
    await admin.auth().generateEmailVerificationLink(userEmail, actionCodeSettings);

    // 5. Create email document for the Trigger Email extension (Gmail/SMTP)
  // 5. Notify approval without forcing password/reset (user already has credentials)
  const displayName = userRecord.displayName || "Utilisateur";
  const subject = "Votre accès a été approuvé";
  const text = `Bonjour ${displayName},\n\nVotre demande d'accès à la plateforme a été approuvée.\nVous pouvez maintenant vous connecter normalement avec vos identifiants: ${userEmail}.`;
  const html = `
      <p>Bonjour ${displayName},</p>
      <p>Votre demande d'accès à la plateforme a été approuvée.</p>
      <p>Vous pouvez maintenant vous connecter normalement avec vos identifiants: <strong>${userEmail}</strong>.</p>
      <p>Si vous avez oublié votre mot de passe, utilisez la fonctionnalité “Mot de passe oublié”.</p>
    `;
  await admin.firestore().collection("mail").add({
    to: userEmail,
    message: { subject, text, html },
  });

    logger.info(`Admin ${auth.uid} approved user ${uid}. Verification email queued.`);
    return { success: true, message: "User approved and verification email sent." };

  } catch (error) {
    logger.error(`Error approving user ${uid} by admin ${auth.uid}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An internal error occurred.", error);
  }
});

/**
 * Callable function to approve an access request and create a new user.
 * - Checks caller is admin
 * - Creates Firebase Auth user with the provided email
 * - Creates Firestore profile with isApproved=true
 * - Updates the accessRequests document status to 'approved'
 * - Generates a password reset link for the new user (notified via logs or email service later)
 */
export const approveAccessRequest = onCall({ cors: true, enforceAppCheck: false }, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const adminUid = auth.uid;
  const adminUserDoc = await admin.firestore().collection("users").doc(adminUid).get();
  const adminProfile = adminUserDoc.data();
  if (adminProfile?.role !== "admin") {
    throw new HttpsError("permission-denied", "The function must be called by an admin user.");
  }

  const { email, requestId } = data as { email?: string; requestId?: string };
  if (!email || !requestId) {
    throw new HttpsError("invalid-argument", "The function must be called with an 'email' and 'requestId' argument.");
  }

  try {
    // 1. Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({ email });

    // 2. Create the user profile in Firestore
    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      role: "consultant",
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
    } as const;
    await admin.firestore().collection("users").doc(userRecord.uid).set(userProfile);

    // 3. Update the access request status to 'approved'
    await admin.firestore().collection("accessRequests").doc(requestId).update({
      status: "approved",
      approvedBy: adminUid,
      approvedAt: new Date(),
    });

    // 4. Generate password reset link (and notify user by email)
    const passwordResetLink = await admin.auth().generatePasswordResetLink(email);
    logger.info(`Password reset link for ${email}: ${passwordResetLink}`);

    // 5. Send approval notification email via Trigger Email extension
    const subject = "Votre demande d'accès a été approuvée";
    const text = `Bonjour,\n\nVotre accès à la plateforme a été approuvé.\nPour définir votre mot de passe, ouvrez ce lien :\n${passwordResetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
    const html = `
      <p>Bonjour,</p>
      <p>Votre accès à la plateforme a été approuvé.</p>
      <p>Pour définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
      <p><a href="${passwordResetLink}" target="_blank" rel="noopener">Définir mon mot de passe</a></p>
      <p>Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :</p>
      <p style="word-break: break-all;">${passwordResetLink}</p>
      <p style="color:#6b7280;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    `;
    await admin.firestore().collection("mail").add({
      to: email,
      message: { subject, text, html },
    });

    return { success: true, message: `User ${email} created successfully and notified.` };
  } catch (error) {
    logger.error("Error approving access request:", error);
    throw new HttpsError("internal", "An internal error occurred while creating the user.", error as Error);
  }
});

