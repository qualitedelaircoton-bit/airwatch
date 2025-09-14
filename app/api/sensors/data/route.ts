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

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error("Firebase Admin SDK not initialized.");
    }

    const { searchParams } = new URL(request.url);
    const sensorIds = searchParams.get("sensors")?.split(",") || [];
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") || "json";

    if (!from || !to || sensorIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required parameters: sensors, from, to" },
        { status: 400 },
      );
    }

    const fromTimestamp = Timestamp.fromDate(new Date(from));
    const toTimestamp = Timestamp.fromDate(new Date(to));

    const sensorDetails = new Map<string, { name: string }>();
    if (sensorIds.length > 0) {
        const sensorDocs = await adminDb!.collection('sensors').where('__name__', 'in', sensorIds).get();
        sensorDocs.forEach(doc => {
            sensorDetails.set(doc.id, { name: doc.data().name || 'Unknown Sensor' });
        });
    }

    const allDataPromises = sensorIds.map(async (sensorId) => {
      const dataQuery = adminDb!
        .collection(`sensors/${sensorId}/data`)
        .where("timestamp", ">=", fromTimestamp)
        .where("timestamp", "<=", toTimestamp)
        .orderBy("timestamp", "asc");

      const querySnapshot = await dataQuery.get();
      const sensorName = sensorDetails.get(sensorId)?.name || 'Unknown Sensor';

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = (data.timestamp as Timestamp).toDate().toISOString();

        return {
          sensorId: sensorId,
          sensorName: sensorName,
          timestamp: timestamp,
          pm1_0: data.pm1_0,
          pm2_5: data.pm2_5,
          pm10: data.pm10,
          o3_raw: data.o3_raw,
          o3_corrige: data.o3_corrige,
          no2_voltage_v: data.no2_voltage_v,
          no2_ppb: data.no2_ppb,
          voc_voltage_v: data.voc_voltage_v,
          co_voltage_v: data.co_voltage_v,
          co_ppb: data.co_ppb,
        };
      });
    });

    const nestedData = await Promise.all(allDataPromises);
    const exportData = nestedData.flat();

    if (format === "csv") {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="sensor-data-export.csv"',
        },
      });
    } else {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="sensor-data-export.json"',
        },
      });
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to export data", details: errorMessage },
      { status: 500 },
    );
  }
}
