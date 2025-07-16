import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
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
  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { email, reason } = body;
    if (!email || !reason) {
      return NextResponse.json({ error: "Email and reason are required." }, { status: 400 });
    }

    // Vérifier si une demande en attente existe déjà pour cet email
    const existingRequestQuery = await adminDb.collection("accessRequests")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingRequestQuery.empty) {
      return NextResponse.json({ error: "An access request for this email is already pending." }, { status: 409 });
    }

    const newDocRef = await adminDb.collection("accessRequests").add({
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
