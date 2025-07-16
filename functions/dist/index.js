"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttWebhook = exports.scheduledSensorStatusUpdate = exports.approveAccessRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const firestore_status_calculator_1 = require("./lib/firestore-status-calculator");
const shared_data_handler_1 = require("./lib/shared-data-handler");
const admin = require("firebase-admin");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const mqttWebhookSecret = (0, params_1.defineSecret)('MQTT_WEBHOOK_SECRET');
/**
 * Callable function to approve an access request.
 * Creates a new user in Firebase Auth and a user profile in Firestore.
 */
exports.approveAccessRequest = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    // 1. Check for authentication and admin role
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUid = auth.uid;
    const adminUserDoc = await admin.firestore().collection("users").doc(adminUid).get();
    const adminProfile = adminUserDoc.data();
    if (adminProfile?.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "The function must be called by an admin user.");
    }
    // 2. Get data from the client
    const { email, requestId } = data;
    if (!email || !requestId) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with an 'email' and 'requestId' argument.");
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
    }
    catch (error) {
        console.error("Error approving access request:", error);
        throw new https_1.HttpsError("internal", "An internal error occurred while creating the user.", error);
    }
});
/**
 * Scheduled function to update the status of all sensors periodically.
 * Replaces the setInterval logic from the old realtimeService.
 */
exports.scheduledSensorStatusUpdate = (0, scheduler_1.onSchedule)("every 5 minutes", async (event) => {
    logger.info("⏰ Running scheduled sensor status update...");
    try {
        await (0, firestore_status_calculator_1.updateAllSensorStatuses)();
        logger.info("✅ Scheduled sensor status update completed successfully.");
    }
    catch (error) {
        logger.error("❌ Error running scheduled sensor status update:", error);
    }
});
exports.mqttWebhook = (0, https_1.onRequest)({ cors: true, secrets: [mqttWebhookSecret] }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    try {
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
        const sensorId = topicMatch[1];
        const sensorRef = admin.firestore().collection("sensors").doc(sensorId);
        const sensorSnap = await sensorRef.get();
        if (!sensorSnap.exists) {
            logger.warn("Unknown sensor", { sensorId });
            res.status(404).json({ error: "Unknown sensor" });
            return;
        }
        const sensor = sensorSnap.data();
        let rawData;
        try {
            rawData = JSON.parse(body.payload);
        }
        catch (error) {
            logger.warn("Invalid JSON payload", { payload: body.payload, error });
            res.status(400).json({ error: "Invalid JSON payload" });
            return;
        }
        const transformedData = (0, shared_data_handler_1.transformDeviceData)(rawData, sensorId);
        if (!transformedData || !(0, shared_data_handler_1.validateSensorData)(transformedData)) {
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
        const newStatus = await (0, firestore_status_calculator_1.calculateSensorStatus)(sensorId);
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
    }
    catch (error) {
        logger.error("❌ Erreur traitement webhook:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=index.js.map