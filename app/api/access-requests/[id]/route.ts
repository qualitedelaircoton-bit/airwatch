import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * PATCH /api/access-requests/:id
 * Met à jour le statut d'une demande d'accès.
 */
export async function PATCH(
  request: NextRequest,
  context: any
) {
  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { status } = body;
    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }
    const maybeParams = context?.params;
    const resolvedParams = typeof maybeParams?.then === 'function' ? await maybeParams : maybeParams;
    const { id } = resolvedParams as { id: string };
    const docRef = adminDb.collection("accessRequests").doc(id);
    await docRef.update({ status, updatedAt: Timestamp.now() });
    return NextResponse.json({ id });
  } catch (error: any) {
    console.error("Error updating access request status:", error);
    return NextResponse.json({ error: "Failed to update access request." }, { status: 500 });
  }
}
