import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateAllSensorStatuses } from "@/lib/status-calculator"

export async function GET() {
  try {
    // Mettre à jour les statuts avant de retourner les données
    await updateAllSensorStatuses()

    const sensors = await prisma.sensor.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sensors)
  } catch (error) {
    console.error("Error fetching sensors:", error)
    return NextResponse.json({ error: "Failed to fetch sensors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newSensor = await prisma.sensor.create({
      data: {
        name: body.name,
        latitude: body.latitude,
        longitude: body.longitude,
        frequency: body.frequency,
        status: "RED", // Nouveau capteur commence en rouge
      },
    })

    return NextResponse.json(newSensor, { status: 201 })
  } catch (error) {
    console.error("Error creating sensor:", error)
    return NextResponse.json({ error: "Failed to create sensor" }, { status: 500 })
  }
}
