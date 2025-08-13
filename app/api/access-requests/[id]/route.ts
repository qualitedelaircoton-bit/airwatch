import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * PATCH /api/access-requests/:id
 * Met à jour le statut d'une demande d'accès.
 */

export const dynamic = "force-static"

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

    if (status === 'rejected') {
      const snap = await docRef.get();
      const data = snap.data() as any;
      const userEmail = data?.email as string | undefined;
      if (userEmail) {
        const subject = "Votre demande d'accès a été refusée";
        const text = `Bonjour,\n\nVotre demande d'accès à la plateforme a été refusée par un administrateur.\nSi vous pensez qu'il s'agit d'une erreur, répondez à cet e‑mail.`;
        const html = `
          <p>Bonjour,</p>
          <p>Votre demande d'accès à la plateforme a été refusée par un administrateur.</p>
          <p>Si vous pensez qu'il s'agit d'une erreur, répondez à cet e‑mail.</p>
        `;
        await adminDb.collection('mail').add({
          to: userEmail,
          message: { subject, text, html },
        });
      }
    }

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error("Error updating access request status:", error);
    return NextResponse.json({ error: "Failed to update access request." }, { status: 500 });
  }
}
