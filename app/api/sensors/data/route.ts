// CETTE ROUTE EST DÉPRÉCIÉE - Elle redirige maintenant vers le nouvel endpoint par capteur à la place
import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

function convertToCSV(data: any[]) {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const csvContent = [headers.join(","), ...data.map((row) => headers.map((header) => row[header]).join(","))].join(
    "\n",
  )

  return csvContent
}


export const dynamic = "force-static"
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized.");
    }

    const { searchParams } = new URL(request.url);
    const sensorIds = searchParams.get("sensors")?.split(",") || [];
    
    if (sensorIds.length === 0) {
      return NextResponse.json({ error: "No sensors specified" }, { status: 400 });
    }
    
    // Rediriger vers le nouvel endpoint pour le premier capteur
    const firstSensorId = sensorIds[0];
    const newUrl = new URL(`/api/sensors/${firstSensorId}/data`, request.url);
    searchParams.forEach((value, key) => newUrl.searchParams.set(key, value));
    return NextResponse.redirect(newUrl);
  } catch (error) {
    console.error("Error exporting data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to export data", details: errorMessage },
      { status: 500 },
    );
  }
}
