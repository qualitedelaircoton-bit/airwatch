import { type NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';

// GET a single sensor by ID
export async function GET(
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

// DELETE a sensor by ID (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }
    const { id } = await params;
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);

    // Check for admin role
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: User is not an admin" }, { status: 403 });
    }

    const sensorRef = db.collection("sensors").doc(id);
    const sensorDoc = await sensorRef.get();

    if (!sensorDoc.exists) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
    }

    await sensorRef.delete();

    return NextResponse.json({ message: "Sensor deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting sensor:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete sensor" },
      { status: 500 }
    );
  }
}

// UPDATE a sensor by ID (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 503 });
    }
    const { id } = await params;
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);

    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: User is not an admin" }, { status: 403 });
    }

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
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update sensor" },
      { status: 500 }
    );
  }
}
