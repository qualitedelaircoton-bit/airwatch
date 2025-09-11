import { type NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { withAuth, withAdminAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }
    const { id } = await params;
    const sensorDoc = await db.collection("sensors").doc(id).get();

    if (!sensorDoc.exists) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    const sensorData = sensorDoc.data();
    return NextResponse.json({ id: sensorDoc.id, ...sensorData });
  } catch (error) {
    console.error("Error fetching sensor:", error);
    return NextResponse.json(
      { error: "Failed to fetch sensor" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }
    const { id } = await params;

    const sensorRef = db.collection("sensors").doc(id);
    const sensorDoc = await sensorRef.get();

    if (!sensorDoc.exists) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    await sensorRef.delete();

    return NextResponse.json({ message: "Sensor deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting sensor:", error);
    return NextResponse.json(
      { error: "Failed to delete sensor" },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }
    const { id } = await params;

    const body = await request.json();
    const { name, latitude, longitude, frequency } = body;

    // Basic validation
    if (!name || latitude === undefined || longitude === undefined || frequency === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sensorRef = db.collection("sensors").doc(id);
    const sensorDoc = await sensorRef.get();

    if (!sensorDoc.exists) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    await sensorRef.update({
      name,
      latitude,
      longitude,
      frequency,
    });

    return NextResponse.json({ message: "Sensor updated successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating sensor:", error);
    return NextResponse.json(
      { error: "Failed to update sensor" },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getHandler)
export const DELETE = withAdminAuth(deleteHandler)
export const PUT = withAdminAuth(putHandler)
