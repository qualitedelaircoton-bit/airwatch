import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateSensorStatus } from "@/lib/status-calculator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Recalculer le statut avant de retourner
    const newStatus = await calculateSensorStatus(params.id)

    const sensor = await prisma.sensor.update({
      where: { id: params.id },
      data: { status: newStatus },
    })

    if (!sensor) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    return NextResponse.json(sensor)
  } catch (error) {
    console.error("Error fetching sensor:", error)
    return NextResponse.json({ error: "Failed to fetch sensor" }, { status: 500 })
  }
}
