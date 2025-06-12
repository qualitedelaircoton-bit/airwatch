import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function convertToCSV(data: any[]) {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const csvContent = [headers.join(","), ...data.map((row) => headers.map((header) => row[header]).join(","))].join(
    "\n",
  )

  return csvContent
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sensors = searchParams.get("sensors")?.split(",") || []
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const format = searchParams.get("format") || "csv"

    if (!from || !to || sensors.length === 0) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const data = await prisma.sensorData.findMany({
      where: {
        sensorId: { in: sensors },
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        sensor: {
          select: { name: true },
        },
      },
      orderBy: [{ sensorId: "asc" }, { timestamp: "asc" }],
    })

    // Type pour les données avec sensor inclus
    type SensorDataWithSensor = typeof data[0]

    // Transformer les données pour l'export
    const exportData = data.map((item: SensorDataWithSensor) => ({
      sensorId: item.sensorId,
      sensorName: item.sensor.name,
      timestamp: item.timestamp.toISOString(),
      pm1_0: item.pm1_0,
      pm2_5: item.pm2_5,
      pm10: item.pm10,
      o3_raw: item.o3_raw,
      o3_corrige: item.o3_corrige,
      no2_voltage_mv: item.no2_voltage_mv,
      no2_ppb: item.no2_ppb,
      voc_voltage_mv: item.voc_voltage_mv,
      co_voltage_mv: item.co_voltage_mv,
      co_ppb: item.co_ppb,
    }))

    if (format === "csv") {
      const csv = convertToCSV(exportData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="sensor-data-export.csv"',
        },
      })
    } else {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="sensor-data-export.json"',
        },
      })
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
