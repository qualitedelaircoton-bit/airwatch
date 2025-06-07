import { prisma } from "./prisma"
import { Status } from "@prisma/client"

export async function calculateSensorStatus(sensorId: string): Promise<Status> {
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId },
  })

  if (!sensor || !sensor.lastSeen) {
    return Status.RED
  }

  const now = new Date()
  const lastSeenTime = new Date(sensor.lastSeen)
  const timeDifferenceMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60)

  // Vert : dans les temps (moins de 1.5x la fréquence)
  if (timeDifferenceMinutes <= sensor.frequency * 1.5) {
    return Status.GREEN
  }

  // Orange : en retard (entre 1.5x et 3x la fréquence)
  if (timeDifferenceMinutes <= sensor.frequency * 3) {
    return Status.ORANGE
  }

  // Rouge : hors ligne (plus de 3x la fréquence)
  return Status.RED
}

export async function updateAllSensorStatuses() {
  const sensors = await prisma.sensor.findMany()

  for (const sensor of sensors) {
    const newStatus = await calculateSensorStatus(sensor.id)

    if (sensor.status !== newStatus) {
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: { status: newStatus },
      })
    }
  }
}
