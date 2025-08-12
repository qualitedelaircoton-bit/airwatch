import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp, CollectionReference, Query } from "firebase-admin/firestore";

/**
 * GET /api/access-requests?status=pending
 * Liste les demandes d'accès filtrées par statut.
 */
export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    let queryRef: CollectionReference | Query = adminDb.collection("accessRequests");
    if (status) {
      queryRef = queryRef.where("status", "==", status);
    }
    const snapshot = await queryRef.get();
    const requests = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email,
        reason: data.reason,
        status: data.status,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      };
    });
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error listing access requests:", error);
    return NextResponse.json({ error: "Failed to list access requests." }, { status: 500 });
  }
}

/**
 * POST /api/access-requests
 * Crée une nouvelle demande d'accès.
 */
export async function POST(request: NextRequest) {
  if (!adminDb || !adminAuth) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 500 });
  }
  try {
    // Require authenticated user and derive uid/email from token
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1]!;
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    const body = await request.json();
    const { reason } = body;
    if (!reason) {
      return NextResponse.json({ error: "Reason is required." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email not found in token." }, { status: 400 });
    }

    // Prevent duplicate pending requests for this uid
    const existingRequestQuery = await adminDb.collection("accessRequests")
      .where("uid", "==", uid)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingRequestQuery.empty) {
      return NextResponse.json({ error: "An access request is already pending for this account." }, { status: 409 });
    }

    const newDocRef = await adminDb.collection("accessRequests").add({
      uid,
      email,
      reason,
      status: "pending",
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ id: newDocRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating access request:", error);
    return NextResponse.json({ error: "Failed to create access request." }, { status: 500 });
  }
}
